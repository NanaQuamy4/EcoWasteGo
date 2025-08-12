// Message Analysis Service for EcoWasteGo
// This service analyzes incoming messages and generates intelligent response suggestions

export interface MessageContext {
  intent: 'greeting' | 'status_update' | 'question' | 'instruction' | 'confirmation' | 'concern' | 'arrival' | 'pickup_ready' | 'delay' | 'cancellation';
  urgency: 'low' | 'medium' | 'high';
  emotion: 'positive' | 'neutral' | 'negative';
  keywords: string[];
  pickupStage: 'pending' | 'accepted' | 'in_progress' | 'arrived' | 'collecting' | 'completed';
}

export interface ResponseSuggestion {
  text: string;
  relevance: number; // 0-1 score
  context: string;
  category: 'immediate' | 'helpful' | 'alternative';
}

class MessageAnalysisService {
  // Keywords for intent detection
  private readonly intentKeywords = {
    greeting: ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'],
    status_update: ['on my way', 'arriving', 'coming', 'reached', 'here', 'location'],
    question: ['when', 'what time', 'where', 'how', 'can you', 'do you'],
    instruction: ['please', 'need', 'require', 'prepare', 'ready', 'wait'],
    confirmation: ['ok', 'okay', 'yes', 'sure', 'confirm', 'understood'],
    concern: ['problem', 'issue', 'delay', 'late', 'sorry', 'apologize'],
    arrival: ['arrived', 'here', 'reached', 'location', 'outside', 'door'],
    pickup_ready: ['ready', 'prepared', 'waste', 'bags', 'outside', 'waiting'],
    delay: ['delay', 'late', 'traffic', 'wait', 'soon', 'few minutes'],
    cancellation: ['cancel', 'stop', 'not coming', 'postpone', 'reschedule']
  };

  // Keywords for urgency detection
  private readonly urgencyKeywords = {
    high: ['urgent', 'emergency', 'immediately', 'now', 'asap', 'critical'],
    medium: ['soon', 'shortly', 'few minutes', 'on time', 'schedule'],
    low: ['when convenient', 'no rush', 'take time', 'flexible']
  };

  // Keywords for emotion detection
  private readonly emotionKeywords = {
    positive: ['great', 'excellent', 'perfect', 'thank', 'appreciate', 'good', 'nice'],
    negative: ['bad', 'terrible', 'awful', 'hate', 'disappointed', 'frustrated', 'angry'],
    neutral: ['okay', 'fine', 'normal', 'standard', 'usual']
  };

  // Contextual response templates
  private readonly responseTemplates = {
    greeting: {
      recycler: [
        'Hi! I\'m your recycler. How can I help you today?',
        'Hello! I\'m on my way to collect your waste.',
        'Good day! I\'m your assigned recycler.'
      ],
      customer: [
        'Hi! Looking forward to the pickup.',
        'Hello! I\'m ready for the waste collection.',
        'Good day! When should I expect you?'
      ]
    },
    status_update: {
      recycler: [
        'I\'m on my way and will arrive in {time}.',
        'Currently en route. ETA: {time}.',
        'Making good progress. Should be there soon.'
      ],
      customer: [
        'Great! I\'ll be ready when you arrive.',
        'Perfect timing! I\'m prepared.',
        'Looking forward to seeing you!'
      ]
    },
    question: {
      recycler: [
        'I\'ll be there in about {time}.',
        'My ETA is {time}. Is that convenient?',
        'I can arrive in {time}. Does that work for you?'
      ],
      customer: [
        'I\'m flexible with timing. What works best for you?',
        'I can adjust my schedule if needed.',
        'Let me know what time works for you.'
      ]
    },
    instruction: {
      recycler: [
        'Understood. I\'ll {action}.',
        'Got it! I\'ll make sure to {action}.',
        'Noted. I\'ll {action} as requested.'
      ],
      customer: [
        'I\'ll make sure everything is ready.',
        'Consider it done! I\'ll prepare accordingly.',
        'I\'ll follow your instructions exactly.'
      ]
    },
    arrival: {
      recycler: [
        'I\'ve arrived at your location!',
        'I\'m here and ready to collect.',
        'Just arrived. Where should I meet you?'
      ],
      customer: [
        'Great! I\'ll come out to meet you.',
        'Perfect! I\'ll bring the waste outside.',
        'Excellent! I\'ll be right there.'
      ]
    },
    pickup_ready: {
      recycler: [
        'Perfect! I\'ll collect it right away.',
        'Great! Let me get started on the collection.',
        'Excellent! I\'ll begin the pickup process.'
      ],
      customer: [
        'Everything is prepared and ready.',
        'The waste is organized and waiting.',
        'All set for collection!'
      ]
    },
    delay: {
      recycler: [
        'I apologize for the delay. I\'ll be there as soon as possible.',
        'Sorry for the inconvenience. I\'m working to get there quickly.',
        'I understand the delay is frustrating. I\'m on my way now.'
      ],
      customer: [
        'No problem! I understand delays happen.',
        'Take your time. I\'m flexible.',
        'Don\'t worry about it. Safety first!'
      ]
    },
    concern: {
      recycler: [
        'I understand your concern. Let me address this immediately.',
        'I\'m here to help resolve any issues.',
        'Please let me know how I can make this right.'
      ],
      customer: [
        'Thank you for addressing this.',
        'I appreciate you taking this seriously.',
        'That\'s very professional of you.'
      ]
    }
  };

  /**
   * Analyze a message to determine its context and intent
   */
  analyzeMessage(message: string, senderType: 'customer' | 'recycler', pickupStage: string): MessageContext {
    const lowerMessage = message.toLowerCase();
    
    // Detect intent
    let intent: MessageContext['intent'] = 'status_update';
    let maxScore = 0;
    
    for (const [intentType, keywords] of Object.entries(this.intentKeywords)) {
      const score = keywords.filter(keyword => lowerMessage.includes(keyword)).length;
      if (score > maxScore) {
        maxScore = score;
        intent = intentType as MessageContext['intent'];
      }
    }

    // Detect urgency
    let urgency: MessageContext['urgency'] = 'medium';
    for (const [urgencyLevel, keywords] of Object.entries(this.urgencyKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        urgency = urgencyLevel as MessageContext['urgency'];
        break;
      }
    }

    // Detect emotion
    let emotion: MessageContext['emotion'] = 'neutral';
    for (const [emotionType, keywords] of Object.entries(this.emotionKeywords)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        emotion = emotionType as MessageContext['emotion'];
        break;
      }
    }

    // Extract relevant keywords
    const keywords = this.extractKeywords(lowerMessage);

    return {
      intent,
      urgency,
      emotion,
      keywords,
      pickupStage: pickupStage as MessageContext['pickupStage']
    };
  }

  /**
   * Generate intelligent response suggestions based on message analysis
   */
  generateResponseSuggestions(
    incomingMessage: string,
    senderType: 'customer' | 'recycler',
    pickupStage: string,
    conversationHistory: string[] = []
  ): ResponseSuggestion[] {
    const context = this.analyzeMessage(incomingMessage, senderType, pickupStage);
    const suggestions: ResponseSuggestion[] = [];

    // Get base templates for the detected intent
    const templates = this.responseTemplates[context.intent]?.[senderType === 'customer' ? 'recycler' : 'customer'] || [];
    
    // Add immediate response suggestions
    templates.forEach(template => {
      suggestions.push({
        text: this.processTemplate(template, context, pickupStage),
        relevance: 0.9,
        context: `Response to ${context.intent}`,
        category: 'immediate'
      });
    });

    // Add contextual suggestions based on pickup stage
    const stageSuggestions = this.getStageBasedSuggestions(context, senderType, pickupStage);
    suggestions.push(...stageSuggestions);

    // Add helpful suggestions based on urgency and emotion
    const helpfulSuggestions = this.getHelpfulSuggestions(context, senderType);
    suggestions.push(...helpfulSuggestions);

    // Add alternative responses based on conversation history
    const alternativeSuggestions = this.getAlternativeSuggestions(context, conversationHistory, senderType);
    suggestions.push(...alternativeSuggestions);

    // Sort by relevance and return top suggestions
    return suggestions
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 6); // Return top 6 suggestions
  }

  /**
   * Process template with dynamic content
   */
  private processTemplate(template: string, context: MessageContext, pickupStage: string): string {
    let processed = template;
    
    // Replace time placeholders
    if (processed.includes('{time}')) {
      const timeSuggestions = ['5 minutes', '10 minutes', '15 minutes', '20 minutes'];
      processed = processed.replace('{time}', timeSuggestions[Math.floor(Math.random() * timeSuggestions.length)]);
    }

    // Replace action placeholders
    if (processed.includes('{action}')) {
      const actionSuggestions = ['follow your instructions', 'handle this properly', 'take care of this'];
      processed = processed.replace('{action}', actionSuggestions[Math.floor(Math.random() * actionSuggestions.length)]);
    }

    return processed;
  }

  /**
   * Get stage-based suggestions
   */
  private getStageBasedSuggestions(
    context: MessageContext,
    senderType: 'customer' | 'recycler',
    pickupStage: string
  ): ResponseSuggestion[] {
    const suggestions: ResponseSuggestion[] = [];

    switch (pickupStage) {
      case 'pending':
        if (senderType === 'recycler') {
          suggestions.push({
            text: 'I\'ll review your request and get back to you soon.',
            relevance: 0.8,
            context: 'Request pending stage',
            category: 'helpful'
          });
        }
        break;

      case 'accepted':
        if (senderType === 'recycler') {
          suggestions.push({
            text: 'Great! I\'ll start planning the route to your location.',
            relevance: 0.8,
            context: 'Request accepted stage',
            category: 'helpful'
          });
        } else {
          suggestions.push({
            text: 'Excellent! I\'m looking forward to the pickup.',
            relevance: 0.8,
            context: 'Request accepted stage',
            category: 'helpful'
          });
        }
        break;

      case 'in_progress':
        if (senderType === 'recycler') {
          suggestions.push({
            text: 'I\'m on my way! I\'ll keep you updated on my progress.',
            relevance: 0.9,
            context: 'Pickup in progress',
            category: 'immediate'
          });
        } else {
          suggestions.push({
            text: 'Perfect! I\'ll be ready when you arrive.',
            relevance: 0.9,
            context: 'Pickup in progress',
            category: 'immediate'
          });
        }
        break;

      case 'arrived':
        if (senderType === 'recycler') {
          suggestions.push({
            text: 'I\'ve arrived! Where should I meet you?',
            relevance: 0.9,
            context: 'Recycler arrived',
            category: 'immediate'
          });
        } else {
          suggestions.push({
            text: 'Great! I\'ll come out to meet you.',
            relevance: 0.9,
            context: 'Recycler arrived',
            category: 'immediate'
          });
        }
        break;

      case 'collecting':
        if (senderType === 'recycler') {
          suggestions.push({
            text: 'I\'m collecting the waste now. This should take about 10-15 minutes.',
            relevance: 0.8,
            context: 'Waste collection in progress',
            category: 'helpful'
          });
        } else {
          suggestions.push({
            text: 'Take your time! I\'m in no rush.',
            relevance: 0.8,
            context: 'Waste collection in progress',
            category: 'helpful'
          });
        }
        break;

      case 'completed':
        if (senderType === 'recycler') {
          suggestions.push({
            text: 'Collection completed! Thank you for choosing our service.',
            relevance: 0.9,
            context: 'Pickup completed',
            category: 'immediate'
          });
        } else {
          suggestions.push({
            text: 'Thank you for the excellent service!',
            relevance: 0.9,
            context: 'Pickup completed',
            category: 'immediate'
          });
        }
        break;
    }

    return suggestions;
  }

  /**
   * Get helpful suggestions based on context
   */
  private getHelpfulSuggestions(context: MessageContext, senderType: 'customer' | 'recycler'): ResponseSuggestion[] {
    const suggestions: ResponseSuggestion[] = [];

    // High urgency responses
    if (context.urgency === 'high') {
      if (senderType === 'recycler') {
        suggestions.push({
          text: 'I understand this is urgent. I\'ll prioritize your request.',
          relevance: 0.8,
          context: 'High urgency response',
          category: 'helpful'
        });
      } else {
        suggestions.push({
          text: 'I\'ll make sure to handle this with priority.',
          relevance: 0.8,
          context: 'High urgency response',
          category: 'helpful'
        });
      }
    }

    // Negative emotion responses
    if (context.emotion === 'negative') {
      if (senderType === 'recycler') {
        suggestions.push({
          text: 'I apologize for any inconvenience. Let me make this right.',
          relevance: 0.8,
          context: 'Negative emotion response',
          category: 'helpful'
        });
      } else {
        suggestions.push({
          text: 'I understand your frustration. I\'m here to help resolve this.',
          relevance: 0.8,
          context: 'Negative emotion response',
          category: 'helpful'
        });
      }
    }

    // Positive emotion responses
    if (context.emotion === 'positive') {
      suggestions.push({
        text: 'I\'m glad I could help! Thank you for the positive feedback.',
        relevance: 0.7,
        context: 'Positive emotion response',
        category: 'helpful'
      });
    }

    return suggestions;
  }

  /**
   * Get alternative suggestions based on conversation history
   */
  private getAlternativeSuggestions(
    context: MessageContext,
    conversationHistory: string[],
    senderType: 'customer' | 'recycler'
  ): ResponseSuggestion[] {
    const suggestions: ResponseSuggestion[] = [];

    // If this is a follow-up message, provide alternatives
    if (conversationHistory.length > 1) {
      if (context.intent === 'question') {
        suggestions.push({
          text: 'Is there anything else you\'d like to know?',
          relevance: 0.6,
          context: 'Follow-up question',
          category: 'alternative'
        });
      }

      if (context.intent === 'status_update') {
        suggestions.push({
          text: 'Would you like me to keep you updated on any changes?',
          relevance: 0.6,
          context: 'Status update follow-up',
          category: 'alternative'
        });
      }
    }

    // Generic helpful responses
    suggestions.push({
      text: 'Is there anything else I can help you with?',
      relevance: 0.5,
      context: 'Generic helpful response',
      category: 'alternative'
    });

    return suggestions;
  }

  /**
   * Extract relevant keywords from message
   */
  private extractKeywords(message: string): string[] {
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'must'];
    
    return message
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.includes(word))
      .slice(0, 5); // Limit to top 5 keywords
  }

  /**
   * Get quick response suggestions for common scenarios
   */
  getQuickResponses(senderType: 'customer' | 'recycler', pickupStage: string): string[] {
    const quickResponses: { [key: string]: string[] } = {
      customer: {
        pending: ['When will you review my request?', 'Can you give me an ETA?', 'Is my request being processed?'],
        accepted: ['What time should I expect you?', 'Do you need any special instructions?', 'Should I prepare anything?'],
        in_progress: ['How far away are you?', 'Should I come outside?', 'Any traffic delays?'],
        arrived: ['I\'ll be right there!', 'Where should I meet you?', 'I\'m coming out now.'],
        collecting: ['Take your time!', 'Do you need help?', 'Everything going smoothly?'],
        completed: ['Thank you!', 'Great service!', 'See you next time!']
      },
      recycler: {
        pending: ['I\'ll review this shortly.', 'Let me check the details.', 'I\'ll get back to you soon.'],
        accepted: ['I\'ll start planning the route.', 'I\'ll be there on time.', 'I\'ll keep you updated.'],
        in_progress: ['I\'m on my way!', 'I\'ll update you on progress.', 'I\'ll arrive shortly.'],
        arrived: ['I\'ve arrived!', 'Where should I meet you?', 'I\'m ready to collect.'],
        collecting: ['I\'ll be quick and efficient.', 'This should take about 10 minutes.', 'I\'m almost done.'],
        completed: ['Collection completed!', 'Thank you for choosing us.', 'Have a great day!']
      }
    };

    return quickResponses[senderType]?.[pickupStage] || ['Thank you!', 'Got it!', 'I understand.'];
  }
}

export const messageAnalysisService = new MessageAnalysisService();
export default messageAnalysisService;
