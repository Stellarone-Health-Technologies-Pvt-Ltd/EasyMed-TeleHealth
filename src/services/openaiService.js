import OpenAI from 'openai';

class OpenAIService {
  constructor() {
    this.client = null;
    this.initialized = false;
  }

  initialize(apiKey) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.client = new OpenAI({
      apiKey: apiKey,
      dangerouslyAllowBrowser: true // Note: In production, use a backend proxy
    });
    this.initialized = true;
  }

  async sendHealthQuery(message, conversationHistory = []) {
    if (!this.initialized) {
      throw new Error('OpenAI service not initialized');
    }

    const systemPrompt = `You are a helpful AI health assistant for EasyMed-TeleHealth platform. 
Your role is to:
- Provide general health information and guidance
- Help users understand symptoms and when to seek medical care
- Offer wellness tips and preventive care advice
- Support users before and after medical consultations
- Encourage users to consult healthcare professionals for serious concerns

Important guidelines:
- Always clarify that you're an AI assistant, not a doctor
- Never provide specific medical diagnoses
- Always recommend consulting healthcare professionals for serious symptoms
- Be empathetic and supportive
- Provide evidence-based health information
- Ask clarifying questions when needed
- Keep responses concise but informative

Remember: You are assisting patients on a telehealth platform, so be professional, caring, and helpful.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const response = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: false
      });

      return {
        success: true,
        message: response.choices[0].message.content,
        usage: response.usage
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get response from AI assistant'
      };
    }
  }

  async getStreamingResponse(message, conversationHistory = [], onChunk) {
    if (!this.initialized) {
      throw new Error('OpenAI service not initialized');
    }

    const systemPrompt = `You are a helpful AI health assistant for EasyMed-TeleHealth platform. 
Your role is to:
- Provide general health information and guidance
- Help users understand symptoms and when to seek medical care
- Offer wellness tips and preventive care advice
- Support users before and after medical consultations
- Encourage users to consult healthcare professionals for serious concerns

Important guidelines:
- Always clarify that you're an AI assistant, not a doctor
- Never provide specific medical diagnoses
- Always recommend consulting healthcare professionals for serious symptoms
- Be empathetic and supportive
- Provide evidence-based health information
- Ask clarifying questions when needed
- Keep responses concise but informative

Remember: You are assisting patients on a telehealth platform, so be professional, caring, and helpful.`;

    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      const stream = await this.client.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        stream: true
      });

      let fullResponse = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullResponse += content;
          onChunk(content);
        }
      }

      return {
        success: true,
        message: fullResponse
      };
    } catch (error) {
      console.error('OpenAI Streaming Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to get streaming response from AI assistant'
      };
    }
  }
}

export default new OpenAIService();
