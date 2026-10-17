import { FunctionDeclaration, Type } from '@google/genai';

// Tool Declarations for Gemini SDK with strict Type enums
export const agentToolDeclarations: FunctionDeclaration[] = [
  {
    name: 'search_knowledge',
    description: 'Search verified project FAQs, policies, bank approvals, directions, and specifications.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description: 'The search query or keyword (e.g. "RERA", "bank loan", "cab pickup", "clubhouse", "token")',
        },
        category: {
          type: Type.STRING,
          description: 'Optional category: financing, legal, site_visit, pricing, policies, directions',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'list_sites',
    description: 'List all available properties, villa plots, luxury villas, and commercial showrooms.',
    parameters: {
      type: Type.OBJECT,
      properties: {},
    },
  },
  {
    name: 'get_site_details',
    description: 'Get in-depth specifications, location details, price range, and highlights for a specific site.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        site_id: { type: Type.STRING, description: 'The unique UUID of the site' },
      },
      required: ['site_id'],
    },
  },
  {
    name: 'send_site_images',
    description: 'Send high-resolution photos/renderings of a site directly to the user in WhatsApp.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        site_id: { type: Type.STRING, description: 'The UUID of the site' },
        max_images: {
          type: Type.NUMBER,
          description: 'Maximum number of images to send (between 1 and 5, default: 3)',
        },
      },
      required: ['site_id'],
    },
  },
  {
    name: 'update_lead',
    description: 'Save or update customer qualification attributes (name, budget, timeline, location, summary).',
    parameters: {
      type: Type.OBJECT,
      properties: {
        name: { type: Type.STRING, description: 'Customer full or first name' },
        budget: { type: Type.STRING, description: 'Estimated budget range (e.g. "₹50 Lakhs", "₹3 Cr")' },
        timeline: { type: Type.STRING, description: 'Expected purchasing timeline (e.g. "Within 15 days", "3 months")' },
        preferred_location: { type: Type.STRING, description: 'Preferred area or corridor' },
        preferred_site_id: { type: Type.STRING, description: 'UUID of the preferred site' },
        intent_to_visit: { type: Type.BOOLEAN, description: 'True if customer indicated interest in visiting' },
        summary: { type: Type.STRING, description: 'Brief 1-line summary of customer needs' },
      },
    },
  },
  {
    name: 'classify_lead',
    description: 'Classify lead stage into COLD, WARM, or HOT with reasoning.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.STRING,
          enum: ['cold', 'warm', 'hot'],
          description: 'The qualification score',
        },
        reason: {
          type: Type.STRING,
          description: 'Clear factual justification for this classification',
        },
      },
      required: ['score', 'reason'],
    },
  },
  {
    name: 'check_availability',
    description: 'Check available site visit appointment slots for upcoming days.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        site_id: { type: Type.STRING, description: 'Optional site UUID to filter slots specifically for that location' },
        days_ahead: { type: Type.NUMBER, description: 'Number of upcoming days to inspect (default: 7)' },
      },
    },
  },
  {
    name: 'book_site_visit',
    description: 'Atomically book a confirmed site visit appointment slot chosen by the customer.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        slot_id: { type: Type.STRING, description: 'UUID of the chosen availability slot' },
        site_id: { type: Type.STRING, description: 'UUID of the site being visited' },
        notes: { type: Type.STRING, description: 'Any special requests such as cab pickup address or attendee count' },
      },
      required: ['slot_id', 'site_id'],
    },
  },
  {
    name: 'reschedule_or_cancel_visit',
    description: 'Cancel or reschedule an existing site visit appointment.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        visit_id: { type: Type.STRING, description: 'UUID of the visit record' },
        action: {
          type: Type.STRING,
          enum: ['cancel', 'reschedule'],
          description: 'Whether to cancel or reschedule',
        },
        new_slot_id: { type: Type.STRING, description: 'Required if action is reschedule' },
        reason: { type: Type.STRING, description: 'Reason for cancellation or change' },
      },
      required: ['visit_id', 'action'],
    },
  },
  {
    name: 'handoff_to_human',
    description: 'Transfer conversation to a human manager for complaints, negotiations, or complex requests.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        reason: { type: Type.STRING, description: 'Specific reason for human intervention' },
      },
      required: ['reason'],
    },
  },
];
