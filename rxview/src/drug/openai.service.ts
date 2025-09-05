import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DrugLabel } from './interfaces/drug-label.interface';
import { CacheService } from './cache.service';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private openai: OpenAI;
  private readonly maxRetries = 3;
  private readonly baseDelay = 1000; // 1 second

  constructor(
    private configService: ConfigService,
    private readonly cacheService: CacheService
  ) {
    const apiKeyEncoded = this.configService.get<string>('OPENAI_API_KEY');
    const apiKey = apiKeyEncoded ? Buffer.from(apiKeyEncoded, 'base64').toString('utf-8') : undefined;
    if (!apiKey) {
      this.logger.warn('OpenAI API key not found. AI features will be disabled.');
      return;
    }
    
    this.openai = new OpenAI({
      apiKey,
    });
  }

  async generateSEOMetadata(drug: DrugLabel): Promise<{ title: string; description: string }> {
    if (!this.openai) {
      return this.getFallbackSEOMetadata(drug);
    }

    // Check cache first
    const cacheKey = `seo_metadata:${drug.setId}`;
    const cached = await this.cacheService.get<{ title: string; description: string }>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Generate SEO-optimized title and meta description for the prescription drug ${drug.drugName} (generic name: ${drug.label.genericName}) manufactured by ${drug.labeler}. Key information: - Drug Name: ${drug.drugName} - Generic Name: ${drug.label.genericName} - Labeler: ${drug.labeler} - Product Type: ${drug.label.productType} ${drug.label.indicationsAndUsage ? `- Primary Uses: ${this.stripHtml(drug.label.indicationsAndUsage).substring(0, 200)}...` : ''} Return JSON with "title" (max 60 chars) and "description" (max 160 chars). Make them engaging and informative for patients and healthcare providers searching for drug information.`;

    return await this.callOpenAIWithRetry(async () => {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        const result = JSON.parse(response);
        // Cache the result
        await this.cacheService.set(cacheKey, result, 86400); // 24 hour TTL
        return result;
      } catch (error) {
        this.logger.warn('Failed to parse OpenAI response, using fallback');
        return this.getFallbackSEOMetadata(drug);
      }
    }, drug);
  }

  async generateDrugSummary(drug: DrugLabel): Promise<string> {
    if (!this.openai) {
      return this.getFallbackSummary(drug);
    }

    // Check cache first
    const cacheKey = `drug_summary:${drug.setId}`;
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const prompt = `Create a clear, informative summary for the prescription medication ${drug.drugName} (${drug.label.genericName}). Key details: - Brand Name: ${drug.drugName} - Generic Name: ${drug.label.genericName} - Manufacturer: ${drug.labeler} ${drug.label.indicationsAndUsage ? `- Primary Uses: ${this.stripHtml(drug.label.indicationsAndUsage).substring(0, 300)}...` : ''} Write 2-3 sentences that explain what this medication is, what it treats, and who makes it. Keep it professional but accessible to patients. Do not include dosage information or medical advice. List at least two related medications a healthcare provider may be interested in prescribing for what this medication treats.`;

    return await this.callOpenAIWithRetry(async () => {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
        max_tokens: 150,
      });

      const response = completion.choices[0]?.message?.content?.trim();
      const summary = response || this.getFallbackSummary(drug);
      
      // Cache the result
      await this.cacheService.set(cacheKey, summary, 86400); // 24 hour TTL
      return summary;
    }, drug);
  }

  async enhanceAllSections(drug: DrugLabel): Promise<Partial<DrugLabel['label']>> {
    if (!this.openai) {
      return {};
    }

    // Check cache first
    const cacheKey = `enhanced_sections:${drug.setId}`;
    const cached = await this.cacheService.get<Partial<DrugLabel['label']>>(cacheKey);
    if (cached) {
      return cached;
    }

    const sectionsToEnhance = {
      indicationsAndUsage: drug.label.indicationsAndUsage,
      dosageAndAdministration: drug.label.dosageAndAdministration,
      dosageFormsAndStrengths: drug.label.dosageFormsAndStrengths,
      warningsAndPrecautions: drug.label.warningsAndPrecautions,
      adverseReactions: drug.label.adverseReactions,
      clinicalPharmacology: drug.label.clinicalPharmacology,
      clinicalStudies: drug.label.clinicalStudies,
      howSupplied: drug.label.howSupplied,
      useInSpecificPopulations: drug.label.useInSpecificPopulations,
      description: drug.label.description,
      nonclinicalToxicology: drug.label.nonclinicalToxicology,
      instructionsForUse: drug.label.instructionsForUse
    };

    // Filter out undefined sections
    const availableSections = Object.entries(sectionsToEnhance)
      .filter(([_, content]) => content && content.trim())
      .reduce((acc, [key, content]) => ({
        ...acc,
        [key]: this.stripHtml(content as string).substring(0, 1000)
      }), {});

    if (Object.keys(availableSections).length === 0) {
      return {};
    }

    const systemPrompt = `You are a medical communication specialist. Your task is to enhance drug label sections to make them more accessible and patient-friendly while maintaining complete medical accuracy. For each provided section, rewrite the content to be clearer and more understandable to patients, but keep all essential medical information. Use simple language and explain medical terms when necessary.`;

    const userPrompt = `Please enhance the following sections for the prescription drug ${drug.drugName} (${drug.label.genericName}) by ${drug.labeler}. Make each section more patient-friendly while maintaining medical accuracy: ${JSON.stringify(availableSections)}`;

    return await this.callOpenAIWithRetry(async () => {
      const response = await this.openai.responses.create({
        model: "gpt-4.1-nano",
        temperature: 0.4,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        text: {
          format: {
            type: "json_schema",
            name: "drug_summary",
            schema: {
              type: "object",
              properties: {
                indicationsAndUsage: {
                  type: "string",
                  description: "Enhance the indications and usage section to be more accessible to patients. Explain what conditions this medication treats and why doctors prescribe it. Use simple language to describe the condition, as well as therapeutic uses while maintaining medical accuracy."
                },
                dosageAndAdministration: {
                  type: "string", 
                  description: "Rewrite the dosage and administration information to be more patient-friendly. Explain how the medication should be taken, when to take it, and any important administration instructions. Clarify medical terms and provide context for dosing schedules."
                },
                dosageFormsAndStrengths: {
                  type: "string",
                  description: "Simplify the dosage forms and strengths section for patient understanding. Explain what forms the medication comes in (tablets, capsules, liquid, etc.) and what the different strengths mean in practical terms."
                },
                warningsAndPrecautions: {
                  type: "string",
                  description: "Enhance the warnings and precautions section to be more understandable while maintaining urgency. Explain potential risks, when to contact a doctor, and important safety information in clear, accessible language."
                },
                adverseReactions: {
                  type: "string",
                  description: "Rewrite the adverse reactions section to be more patient-friendly. Explain what side effects patients might experience, categorize them by severity or frequency when possible, and clarify medical terminology."
                },
                clinicalPharmacology: {
                  type: "string",
                  description: "Simplify the clinical pharmacology section for patient comprehension. Explain how the medication works in the body, its mechanism of action, and absorption/elimination in understandable terms."
                },
                clinicalStudies: {
                  type: "string",
                  description: "Enhance the clinical studies section to be more accessible. Explain what research has been done to test the medication's effectiveness, what the studies showed, and what this means for patients in simple terms."
                },
                howSupplied: {
                  type: "string",
                  description: "Rewrite the how supplied section to be more patient-friendly. Explain how the medication is packaged, what patients can expect when they receive their prescription, and any storage instructions in clear language."
                },
                useInSpecificPopulations: {
                  type: "string", 
                  description: "Simplify the use in specific populations section for better understanding. Explain how the medication affects different groups (pregnant women, elderly, children, etc.) and any special considerations in accessible language."
                },
                description: {
                  type: "string",
                  description: "Enhance the description section to be more patient-friendly. Explain what the medication contains, its chemical properties, and physical characteristics in understandable terms while maintaining accuracy."
                },
                nonclinicalToxicology: {
                  type: "string",
                  description: "Rewrite the nonclinical toxicology section to be more accessible. Explain what safety testing has been done in laboratory studies and what this means for patient safety in simple, clear language."
                },
                instructionsForUse: {
                  type: "string",
                  description: "Enhance the instructions for use section to be more patient-friendly. Provide clear, step-by-step guidance on how to properly use the medication, explaining any special devices or techniques required."
                }
              },
              required: Object.keys(availableSections),
              additionalProperties: false
            }
          }
        }
      });

      const result = JSON.parse(response.output_text);
      
      // Cache the result
      await this.cacheService.set(cacheKey, result, 86400); // 24 hour TTL
      return result;
    }, drug);
  }

  // Legacy method - now deprecated in favor of enhanceAllSections
  async enhanceSection(content: string, drug: DrugLabel): Promise<string> {
    this.logger.warn('enhanceSection is deprecated. Use enhanceAllSections for better efficiency.');
    if (!this.openai || !content) {
      return '';
    }

    // Check cache first
    const cacheKey = `enhanced_section:${drug.setId}:${this.hashContent(content)}`;
    const cached = await this.cacheService.get<string>(cacheKey);
    if (cached) {
      return cached;
    }

    const strippedContent = this.stripHtml(content).substring(0, 1000);
    const prompt = `Improve the readability of this drug information section for ${drug.drugName}. Make it more accessible to patients while keeping all medical accuracy. Add helpful context where appropriate. Original content: ${strippedContent} Rewrite this to be clearer and more patient-friendly while maintaining medical accuracy. Use simple language and explain medical terms. Keep the same essential information.`;

    return await this.callOpenAIWithRetry(async () => {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4.1-nano',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 500,
      });

      const response = completion.choices[0]?.message?.content?.trim() || '';
      
      // Cache the result
      if (response) {
        await this.cacheService.set(cacheKey, response, 86400); // 24 hour TTL
      }
      return response;
    }, drug);
  }

  private async callOpenAIWithRetry<T>(
    operation: () => Promise<T>,
    drug: DrugLabel,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      this.logger.warn(`OpenAI API call failed for ${drug.drugName} (attempt ${attempt}):`, error.message);

      if (attempt >= this.maxRetries) {
        this.logger.error(`Max retries exceeded for ${drug.drugName}`);
        throw error;
      }

      // Handle rate limits with exponential backoff
      if (error.status === 429 || error.code === 'rate_limit_exceeded') {
        const delay = this.baseDelay * Math.pow(2, attempt - 1);
        this.logger.log(`Rate limited, waiting ${delay}ms before retry ${attempt + 1}`);
        await this.sleep(delay);
      } else {
        // For other errors, shorter delay
        await this.sleep(500);
      }

      return this.callOpenAIWithRetry(operation, drug, attempt + 1);
    }
  }

  private getFallbackSEOMetadata(drug: DrugLabel): { title: string; description: string } {
    return {
      title: `${drug.drugName} (${drug.label.genericName}) - Prescription Info`,
      description: `Complete prescribing information for ${drug.drugName} (${drug.label.genericName}) by ${drug.labeler}. Dosage, side effects, warnings & more.`,
    };
  }

  private getFallbackSummary(drug: DrugLabel): string {
    return `${drug.drugName} is a prescription medication containing the active ingredient ${drug.label.genericName}, manufactured by ${drug.labeler}.`;
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private hashContent(content: string): string {
    // Simple hash for caching section content
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
  }
}