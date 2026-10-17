async (page) => {
  const context = page.context();
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const htmlContent = `
<div style="font-family: Arial, sans-serif; font-size: 11pt; color: #1f2937; line-height: 1.6;">

  <div style="text-align: center; margin-bottom: 25px;">
    <p style="font-size: 14pt; font-weight: bold; color: #111827; margin: 0; text-transform: uppercase;">Sathyabama Institute of Science and Technology</p>
    <p style="font-size: 11pt; color: #4b5563; margin: 4px 0;">(Deemed to be University) • Chennai, Tamil Nadu</p>
    <p style="font-size: 12pt; font-weight: bold; color: #1f2937; margin: 4px 0;">Department of Computer Science &amp; Engineering</p>
    <p style="font-size: 11pt; color: #6b7280; margin: 2px 0;">Academic Year: 2025 &ndash; 2026</p>
    <hr style="border: 0; border-top: 2px solid #2563eb; margin: 15px auto; width: 80%;" />
  </div>

  <h1 style="color: #1e3a8a; font-size: 20pt; text-align: center; margin-bottom: 8px;">WhatsApp AI Lead Qualification &amp; Site-Visit Booking Agent</h1>
  <p style="text-align: center; font-size: 12pt; color: #4b5563; font-style: italic; margin-top: 0;">An Autonomous Generative AI Assistant for Real Estate Lead Triage &amp; Automated Appointment Scheduling</p>

  <div style="background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 12px 18px; margin: 20px 0; border-radius: 4px;">
    <p style="margin: 3px 0;"><b>Project Authors / Team Members:</b></p>
    <ul style="margin: 6px 0; padding-left: 24px;">
      <li><b>Gunda Ganesh</b> &mdash; B.E. Computer Science &amp; Engineering</li>
      <li><b>Guddati Rosi</b> &mdash; B.E. Computer Science &amp; Engineering</li>
      <li><b>Grandhi Karthik</b> &mdash; B.E. Computer Science &amp; Engineering</li>
    </ul>
    <p style="margin: 3px 0;"><b>Department:</b> Computer Science &amp; Engineering (B.E. CSE)</p>
    <p style="margin: 3px 0;"><b>Institution:</b> Sathyabama Institute of Science and Technology, Chennai</p>
    <p style="margin: 3px 0;"><b>Academic Year:</b> 2025 &ndash; 2026</p>
    <p style="margin: 3px 0;"><b>Project Submission Date:</b> October 2026</p>
  </div>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">1. Project Submission Links &amp; Deliverables</h2>
  <p style="color: #4b5563; margin-bottom: 10px;"><i>All project artifacts are hosted online on GitHub for direct evaluation and review:</i></p>
  
  <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin: 12px 0;">
    <tr style="background-color: #f9fafb;">
      <th style="text-align: left; width: 26%; font-weight: bold; border: 1px solid #d1d5db;">Deliverable</th>
      <th style="text-align: left; width: 44%; font-weight: bold; border: 1px solid #d1d5db;">Online Access Link (Click to Open)</th>
      <th style="text-align: left; width: 30%; font-weight: bold; border: 1px solid #d1d5db;">Description</th>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Public GitHub Repository</b></td>
      <td style="border: 1px solid #d1d5db;">
        🔗 <a href="https://github.com/bunnyrams69/AI_Automation_Agent" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Open GitHub Repository</a><br/>
        <span style="font-size: 9pt; color: #6b7280;">https://github.com/bunnyrams69/AI_Automation_Agent</span>
      </td>
      <td style="border: 1px solid #d1d5db;">Complete source code, Fastify server, database schema, tests, and documentation.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Presentation Deck (PPTX)</b></td>
      <td style="border: 1px solid #d1d5db;">
        📊 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/WhatsApp_AI_Agent_Explainer.pptx" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">View Presentation on GitHub</a><br/>
        📥 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/raw/main/docs/WhatsApp_AI_Agent_Explainer.pptx" target="_blank" style="color: #059669; font-weight: bold; text-decoration: underline;">Direct One-Click Download (.pptx)</a>
      </td>
      <td style="border: 1px solid #d1d5db;">17-slide visual presentation deck with comprehensive speaker notes and demo screenshots.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Live Test Screenshots</b></td>
      <td style="border: 1px solid #d1d5db;">
        🖼️ <a href="https://github.com/bunnyrams69/AI_Automation_Agent/tree/main/docs/screenshots" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">Browse Screenshots Directory</a>
      </td>
      <td style="border: 1px solid #d1d5db;">5 actual WhatsApp interaction screenshots demonstrating live qualification and Cal.com booking.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Automated Test Suite Proof</b></td>
      <td style="border: 1px solid #d1d5db;">
        🧪 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/vitest_test_results.png" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">View Vitest Test Results Image</a>
      </td>
      <td style="border: 1px solid #d1d5db;">61 automated unit and integration tests passing with 100% success rate across 12 suites.</td>
    </tr>
  </table>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">2. Executive Summary (Simple Explanation)</h2>
  <p>In the real estate and high-ticket sales sector, customer leads are expensive. Real estate developers spend large marketing budgets on social media advertisements to attract potential property buyers. However, <b>over 60% of interested leads are permanently lost</b> because customer inquiries arrive outside normal business hours (in the evenings, late at night, or on weekends) when human sales representatives are offline. When a human representative calls back the next day, the buyer has often lost interest, forgotten the inquiry, or already booked with a competitor.</p>
  <p>Furthermore, human sales executives spend up to 70% of their workday answering basic repetitive questions (e.g., plot sizes, Vastu orientation, pricing, and directions) and dealing with casual browsers who lack the budget to purchase, leaving them exhausted and taking time away from serious buyers.</p>
  <p>To solve this critical bottleneck, we engineered the <b>WhatsApp AI Lead Qualification &amp; Site-Visit Booking Agent</b>.</p>
  <p>Our project is an autonomous conversational agent operating 24/7 on WhatsApp. When a prospective buyer sends a message, our system immediately responds in natural, professional English. It answers questions regarding available plots, pricing, legal approvals, and amenities by querying a live database &mdash; <b>it never invents fake discounts or hallucinated information</b>. It understands colloquial Indian financial figures such as <i>"85L"</i>, <i>"1.5 Cr"</i>, or <i>"2core"</i>, evaluates the buyer's purchase readiness into <b>Cold, Warm, or Hot</b>, shares the exact Google Maps location pin, checks available appointments in real time on <b>Cal.com</b>, books a confirmed physical site visit with free cab pickup, and instantly emails a full summary to the business owner.</p>
  <p>The entire process completes autonomously in under two minutes with zero human intervention required.</p>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">3. Traditional Problem vs. Our AI Solution</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin: 12px 0;">
    <tr style="background-color: #f9fafb;">
      <th style="text-align: left; width: 50%; font-weight: bold; border: 1px solid #d1d5db; color: #b91c1c;">The Traditional Process (Bottlenecks)</th>
      <th style="text-align: left; width: 50%; font-weight: bold; border: 1px solid #d1d5db; color: #15803d;">Our WhatsApp AI Solution (Advantages)</th>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><b>Slow Follow-Up:</b> Inquiries wait 12 to 24 hours for callback.</li>
          <li><b>High Lead Decay:</b> 60%+ of digital leads go cold before contact.</li>
          <li><b>Manual Qualification:</b> Sales reps spend hours calling casual browsers.</li>
          <li><b>Scheduling Hassles:</b> Coordinating site visits requires 4&ndash;6 phone calls over multiple days.</li>
          <li><b>Hallucinations &amp; Inconsistency:</b> Inexperienced junior staff quote conflicting details.</li>
        </ul>
      </td>
      <td style="border: 1px solid #d1d5db; vertical-align: top;">
        <ul style="margin: 0; padding-left: 20px;">
          <li><b>Sub-3-Second Replies:</b> Immediate WhatsApp engagement 24 hours a day, 7 days a week.</li>
          <li><b>Zero Hallucinations:</b> AI reads verified plot inventory and prices directly from Supabase PostgreSQL.</li>
          <li><b>Indian Currency Intelligence:</b> Accurately understands colloquial figures like <i>"1.75cr"</i> and <i>"90L"</i>.</li>
          <li><b>Frictionless Cal.com Booking:</b> Real-time appointment scheduling with automated cab pickup coordination.</li>
          <li><b>Instant Management Alerts:</b> Automatic HTML email summary sent to business owner upon booking.</li>
        </ul>
      </td>
    </tr>
  </table>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">4. System Architecture &amp; The 7-Step Pipeline</h2>
  <p>The system operates as an asynchronous, event-driven backend service built on <b>Fastify (Node.js &amp; TypeScript)</b>, orchestrated with <b>Google Gemini 1.5 Flash</b>, <b>Supabase PostgreSQL</b>, <b>Meta WhatsApp Cloud API</b>, and <b>Cal.com</b>:</p>
  <ol style="margin: 8px 0; padding-left: 24px; line-height: 1.8;">
    <li><b>Webhook Ingestion:</b> Meta Cloud API dispatches an HTTP POST webhook payload to our Fastify server upon every incoming message. The server validates the cryptographic <code>X-Hub-Signature-256</code> HMAC signature using the app secret.</li>
    <li><b>Idempotent Deduplication:</b> Meta uses "at-least-once" delivery, which can result in duplicate webhooks. Incoming message IDs are logged in the <code>processed_messages</code> table; duplicates are acknowledged immediately and discarded.</li>
    <li><b>Conversation Context Retrieval:</b> The server retrieves the last 15 conversation turns and current lead profile from the PostgreSQL database.</li>
    <li><b>Agentic Reasoning:</b> Google Gemini 1.5 Flash evaluates the dialogue context. Guided by a strict system prompt, it formulates a response or decides to execute one of 10 registered system tools.</li>
    <li><b>Tool Execution:</b> The Fastify backend executes the requested tool (e.g., querying inventory in Supabase or checking appointment slots on Cal.com) and returns the data back to Gemini.</li>
    <li><b>Outbound Messaging:</b> The synthesized, friendly WhatsApp message is formatted and dispatched to the customer's phone via Meta Graph API v21.0.</li>
    <li><b>Lead Persistence &amp; Alerting:</b> The lead's qualification status is updated in the database, and confirmed bookings immediately trigger an automated HTML email alert to the developer via Nodemailer SMTP.</li>
  </ol>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">5. The 10 Registered Tools (Grounded AI Engine)</h2>
  <p>To eliminate artificial intelligence hallucinations and guarantee factual accuracy, the model is bound by a strict tool-calling protocol with 10 functions:</p>
  <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin: 12px 0;">
    <tr style="background-color: #f9fafb;">
      <th style="width: 6%; text-align: center; font-weight: bold; border: 1px solid #d1d5db;">#</th>
      <th style="width: 28%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Tool Name</th>
      <th style="width: 66%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Function &amp; Operational Purpose</th>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>1</b></td>
      <td style="border: 1px solid #d1d5db;"><code>lookup_inventory</code></td>
      <td style="border: 1px solid #d1d5db;">Fetches exact plot specifications: plot number, dimensions (e.g. 50'x90'), facing (East/West/North/South), square yardage, and price.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>2</b></td>
      <td style="border: 1px solid #d1d5db;"><code>check_availability</code></td>
      <td style="border: 1px solid #d1d5db;">Queries the database for unsold plots matching customer requirements (e.g., East-facing plots under ₹2 Cr).</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>3</b></td>
      <td style="border: 1px solid #d1d5db;"><code>get_project_amenities</code></td>
      <td style="border: 1px solid #d1d5db;">Returns verified development features: 25,000 sq.ft luxury clubhouse, underground cabling, swimming pool, sports courts, and 24/7 CCTV.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>4</b></td>
      <td style="border: 1px solid #d1d5db;"><code>get_rera_details</code></td>
      <td style="border: 1px solid #d1d5db;">Provides verified legal credentials: government RERA registration numbers, HMDA/DTCP sanctions, and encumbrance certificates.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>5</b></td>
      <td style="border: 1px solid #d1d5db;"><code>get_location_details</code></td>
      <td style="border: 1px solid #d1d5db;">Returns official Google Maps navigation coordinates, distance to Hyderabad International Airport, Outer Ring Road (ORR), and Financial District.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>6</b></td>
      <td style="border: 1px solid #d1d5db;"><code>parse_buyer_budget</code></td>
      <td style="border: 1px solid #d1d5db;">Converts irregular colloquial Indian currency text (e.g., <i>"80L"</i>, <i>"1.75cr"</i>, <i>"1core"</i>) into standardized numerical rupees (<code>8000000</code>, <code>17500000</code>).</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>7</b></td>
      <td style="border: 1px solid #d1d5db;"><code>qualify_lead</code></td>
      <td style="border: 1px solid #d1d5db;">Evaluates buyer readiness across budget compatibility, purchase timeline, and financing status to classify the lead into <b>Cold</b>, <b>Warm</b>, or <b>Hot</b>.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>8</b></td>
      <td style="border: 1px solid #d1d5db;"><code>get_available_booking_slots</code></td>
      <td style="border: 1px solid #d1d5db;">Queries Cal.com API v2 for open 45-minute site-visit slots across the upcoming 7 business days in Indian Standard Time (IST).</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>9</b></td>
      <td style="border: 1px solid #d1d5db;"><code>book_site_visit</code></td>
      <td style="border: 1px solid #d1d5db;">Books the selected appointment on Cal.com, captures customer cab pickup location, generates booking UID, and logs appointment.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;"><b>10</b></td>
      <td style="border: 1px solid #d1d5db;"><code>escalate_to_human</code></td>
      <td style="border: 1px solid #d1d5db;">Immediately halts AI automation and alerts human sales staff when a buyer explicitly requests a person or expresses dissatisfaction.</td>
    </tr>
  </table>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">6. Demonstration &amp; Experimental Results (5 Real WhatsApp Test Turns)</h2>
  <p>The system was tested using live WhatsApp webhooks. The exact conversational sequence captured in our project test screenshots is detailed below (click any turn link to view the actual screenshot proof):</p>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin: 12px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">
      Turn 1 &mdash; Initial Inquiry &amp; Inventory Discovery
      <span style="float: right; font-weight: normal; font-size: 9pt;">
        📸 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/01_greeting_plotsizes.png" target="_blank" style="color: #2563eb; text-decoration: underline;">View Screenshot 1</a>
      </span>
    </p>
    <p style="margin: 0 0 4px 0; color: #0284c7;"><b>Buyer:</b> &ldquo;Hi, I am interested in your luxury villa plots project. What plots are available?&rdquo;</p>
    <p style="margin: 0; color: #166534;"><b>WhatsApp AI Agent:</b> Welcomes the buyer to <i>Greenfield Meadows</i> and invokes <code>check_availability</code>. Informs the user of available units: Plot #10 (350 sq.yd, West facing), Plot #12 (500 sq.yd, East facing), and Plot #15 (450 sq.yd, North facing).</p>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin: 12px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">
      Turn 2 &mdash; Specific Plot Specifications &amp; Pricing
      <span style="float: right; font-weight: normal; font-size: 9pt;">
        📸 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/02_facing_plotchoice.png" target="_blank" style="color: #2563eb; text-decoration: underline;">View Screenshot 2</a>
      </span>
    </p>
    <p style="margin: 0 0 4px 0; color: #0284c7;"><b>Buyer:</b> &ldquo;Can you tell me more about Plot 12? What are the dimensions and total price?&rdquo;</p>
    <p style="margin: 0; color: #166534;"><b>WhatsApp AI Agent:</b> Calls <code>lookup_inventory(plot_number=12)</code>. Accurately reports: 500 sq.yds (50' x 90'), premium East-facing vastu compliance, ₹35,000 per sq.yd, totaling ₹1.75 Crores all-inclusive with immediate registration readiness.</p>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin: 12px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">
      Turn 3 &mdash; Budget Qualification &amp; Lead Categorization
      <span style="float: right; font-weight: normal; font-size: 9pt;">
        📸 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/03_funding_qualification.png" target="_blank" style="color: #2563eb; text-decoration: underline;">View Screenshot 3</a>
      </span>
    </p>
    <p style="margin: 0 0 4px 0; color: #0284c7;"><b>Buyer:</b> &ldquo;My budget is around 1.8 to 2 Cr. Looking to buy immediately, self-funded without bank loan.&rdquo;</p>
    <p style="margin: 0; color: #166534;"><b>WhatsApp AI Agent:</b> Invokes <code>parse_buyer_budget</code> (standardizes to ₹2,00,00,000) and calls <code>qualify_lead</code>. Flags lead as <b>HOT</b> (budget matches project tier, immediate purchase horizon, self-funded). Confirms Plot #12 is well within budget.</p>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin: 12px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">
      Turn 4 &mdash; Location Pin &amp; Appointment Slot Presentation
      <span style="float: right; font-weight: normal; font-size: 9pt;">
        📸 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/04_maps_location_link.png" target="_blank" style="color: #2563eb; text-decoration: underline;">View Screenshot 4</a>
      </span>
    </p>
    <p style="margin: 0 0 4px 0; color: #0284c7;"><b>Buyer:</b> &ldquo;Where exactly is the site located? Can I visit next week?&rdquo;</p>
    <p style="margin: 0; color: #166534;"><b>WhatsApp AI Agent:</b> Calls <code>get_location_details</code> and provides Google Maps directions (Shankarpally Road, 25 mins from Gachibowli). Concurrently queries Cal.com via <code>get_available_booking_slots</code> and suggests: Monday at 10:30 AM, Monday at 2:30 PM, or Tuesday at 11:00 AM.</p>
  </div>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 14px; margin: 12px 0;">
    <p style="margin: 0 0 6px 0; font-weight: bold; color: #0f172a;">
      Turn 5 &mdash; Confirmed Booking &amp; Owner Notification
      <span style="float: right; font-weight: normal; font-size: 9pt;">
        📸 <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/05_booking_confirmed.png" target="_blank" style="color: #2563eb; text-decoration: underline;">View Screenshot 5</a>
      </span>
    </p>
    <p style="margin: 0 0 4px 0; color: #0284c7;"><b>Buyer:</b> &ldquo;Monday 2:30 PM works. Please arrange a pickup from Gachibowli circle.&rdquo;</p>
    <p style="margin: 0; color: #166534;"><b>WhatsApp AI Agent:</b> Calls <code>book_site_visit</code>. Generates confirmed booking reference <code>BK-84729</code>, confirms AC cab pickup from Gachibowli circle for Monday 2:30 PM, and dispatches an instant HTML alert email to the business owner.</p>
  </div>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">7. Technology Stack Specifications</h2>
  <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin: 12px 0;">
    <tr style="background-color: #f9fafb;">
      <th style="width: 25%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Layer / Component</th>
      <th style="width: 25%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Technology</th>
      <th style="width: 15%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Version</th>
      <th style="width: 35%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Role in Architecture</th>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Backend Runtime</b></td>
      <td style="border: 1px solid #d1d5db;">Node.js</td>
      <td style="border: 1px solid #d1d5db;">v20.x LTS</td>
      <td style="border: 1px solid #d1d5db;">Server-side JavaScript runtime engine.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Programming Language</b></td>
      <td style="border: 1px solid #d1d5db;">TypeScript</td>
      <td style="border: 1px solid #d1d5db;">v5.x</td>
      <td style="border: 1px solid #d1d5db;">Type safety and schema validation.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Web Framework</b></td>
      <td style="border: 1px solid #d1d5db;">Fastify</td>
      <td style="border: 1px solid #d1d5db;">v5.x</td>
      <td style="border: 1px solid #d1d5db;">High-throughput HTTP webhook server.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Generative AI Model</b></td>
      <td style="border: 1px solid #d1d5db;">Google Gemini 1.5 Flash</td>
      <td style="border: 1px solid #d1d5db;">Official SDK</td>
      <td style="border: 1px solid #d1d5db;">Natural language reasoning and native tool calling.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Database &amp; Storage</b></td>
      <td style="border: 1px solid #d1d5db;">Supabase (PostgreSQL)</td>
      <td style="border: 1px solid #d1d5db;">v15.x</td>
      <td style="border: 1px solid #d1d5db;">Relational store for inventory, leads, chats, and logs.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Calendar Scheduling</b></td>
      <td style="border: 1px solid #d1d5db;">Cal.com API</td>
      <td style="border: 1px solid #d1d5db;">v2.0</td>
      <td style="border: 1px solid #d1d5db;">Real-time appointment slot search and booking.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Messaging Platform</b></td>
      <td style="border: 1px solid #d1d5db;">Meta WhatsApp Cloud API</td>
      <td style="border: 1px solid #d1d5db;">Graph v21.0</td>
      <td style="border: 1px solid #d1d5db;">Official enterprise messaging communication channel.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Email Transport</b></td>
      <td style="border: 1px solid #d1d5db;">Nodemailer</td>
      <td style="border: 1px solid #d1d5db;">v6.x</td>
      <td style="border: 1px solid #d1d5db;">Instant HTML booking alerts to business management.</td>
    </tr>
    <tr>
      <td style="border: 1px solid #d1d5db;"><b>Testing Suite</b></td>
      <td style="border: 1px solid #d1d5db;">Vitest</td>
      <td style="border: 1px solid #d1d5db;">v2.x</td>
      <td style="border: 1px solid #d1d5db;">61 unit and integration test assertions across 12 suites.</td>
    </tr>
  </table>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">8. Quality Assurance &amp; Automated Verification</h2>
  <p>The codebase is rigorously validated with <b>61 automated unit and integration tests</b> passing across 12 test suites:</p>
  <ul style="margin: 8px 0; padding-left: 24px; line-height: 1.8;">
    <li><code>meta-signature.test.ts</code>: Validates HMAC-SHA256 signature verification to reject forged requests.</li>
    <li><code>deduplication.test.ts</code>: Guarantees idempotency by discarding duplicate Meta webhooks.</li>
    <li><code>budget-parser.test.ts</code>: Validates parsing for expressions like <i>"1.5cr"</i>, <i>"95lacs"</i>, <i>"80L"</i>, <i>"2core"</i>.</li>
    <li><code>qualification.test.ts</code>: Validates criteria for classifying leads into Cold, Warm, and Hot tiers.</li>
    <li><code>calcom.test.ts</code>: Verifies slot retrieval, timezone conversion (Asia/Kolkata), and booking payload creation.</li>
    <li><code>tools.test.ts</code>: Verifies input argument schemas and error handling across all 10 tools.</li>
  </ul>
  <p><b>Test Execution Benchmark:</b> All 61 tests complete in ~1.35 seconds with 100% pass rate. Proof screenshot: <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/vitest_test_results.png" target="_blank" style="color: #2563eb; text-decoration: underline;">vitest_test_results.png</a>.</p>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">9. Presentation Slide Deck Structure</h2>
  <p>A companion presentation deck of 17 slides is available for review: <a href="https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/WhatsApp_AI_Agent_Explainer.pptx" target="_blank" style="color: #2563eb; text-decoration: underline;">WhatsApp_AI_Agent_Explainer.pptx</a> (or <a href="https://github.com/bunnyrams69/AI_Automation_Agent/raw/main/docs/WhatsApp_AI_Agent_Explainer.pptx" target="_blank" style="color: #059669; text-decoration: underline;">Direct Download</a>):</p>
  <table border="1" cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db; margin: 12px 0;">
    <tr style="background-color: #f9fafb;">
      <th style="width: 15%; text-align: center; font-weight: bold; border: 1px solid #d1d5db;">Slide #</th>
      <th style="width: 35%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Slide Title</th>
      <th style="width: 50%; text-align: left; font-weight: bold; border: 1px solid #d1d5db;">Key Topic Covered</th>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 1</td>
      <td style="border: 1px solid #d1d5db;">Title &amp; Academic Identity</td>
      <td style="border: 1px solid #d1d5db;">Project title, authors (Ganesh, Rosi, Karthik), Sathyabama B.E. CSE.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 2</td>
      <td style="border: 1px solid #d1d5db;">The Real-World Problem</td>
      <td style="border: 1px solid #d1d5db;">Lead leakage after hours, slow follow-up times, sales team fatigue.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 3</td>
      <td style="border: 1px solid #d1d5db;">The Solution: WhatsApp AI Agent</td>
      <td style="border: 1px solid #d1d5db;">24/7 conversational booking and lead triage prototype.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 4</td>
      <td style="border: 1px solid #d1d5db;">How It Works: 7-Step Pipeline</td>
      <td style="border: 1px solid #d1d5db;">From Meta webhook to tool execution and Cal.com booking.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 5</td>
      <td style="border: 1px solid #d1d5db;">System Architecture</td>
      <td style="border: 1px solid #d1d5db;">Fastify, Gemini 1.5 Flash, Supabase PostgreSQL, and Cal.com.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 6</td>
      <td style="border: 1px solid #d1d5db;">The 10 Agent Tools</td>
      <td style="border: 1px solid #d1d5db;">Function calling mechanism ensuring grounded, factual data.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 7</td>
      <td style="border: 1px solid #d1d5db;">Indian Budget Parser</td>
      <td style="border: 1px solid #d1d5db;">Regex &amp; heuristics for <i>"1.5 Cr"</i>, <i>"85L"</i>, <i>"2core"</i>.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 8</td>
      <td style="border: 1px solid #d1d5db;">Lead Qualification Matrix</td>
      <td style="border: 1px solid #d1d5db;">Cold vs. Warm vs. Hot triage logic based on budget and timeline.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 9</td>
      <td style="border: 1px solid #d1d5db;">Cal.com Integration</td>
      <td style="border: 1px solid #d1d5db;">Real-time slot querying, double-booking prevention, cab pickup capture.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 10&ndash;14</td>
      <td style="border: 1px solid #d1d5db;">Live Demonstration Results</td>
      <td style="border: 1px solid #d1d5db;">5 actual WhatsApp chat turns with embedded real test screenshots.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 15</td>
      <td style="border: 1px solid #d1d5db;">Technology Stack &amp; Testing</td>
      <td style="border: 1px solid #d1d5db;">61 passing Vitest tests, repository QR code, GitHub link.</td>
    </tr>
    <tr>
      <td style="text-align: center; border: 1px solid #d1d5db;">Slide 16&ndash;17</td>
      <td style="border: 1px solid #d1d5db;">Appendix: Challenges &amp; Future Scope</td>
      <td style="border: 1px solid #d1d5db;">Webhook timeouts, hallucination safeguards, multilingual voice notes roadmap.</td>
    </tr>
  </table>

  <h2 style="color: #1e40af; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 25px;">10. Student Declaration &amp; Academic Sign-off</h2>
  <p>We hereby declare that this project report entitled <b>&ldquo;WhatsApp AI Lead Qualification &amp; Site-Visit Booking Agent&rdquo;</b> is our original work carried out for our Bachelor of Engineering (B.E.) degree in the <b>Department of Computer Science &amp; Engineering</b> at <b>Sathyabama Institute of Science and Technology</b>, Chennai, during the academic year <b>2025 &ndash; 2026</b>.</p>
  <p>All source code, database migrations, configuration templates, and testing suites are publicly accessible in the project repository:</p>
  <p style="margin: 12px 0;"><b>GitHub Repository:</b> <a href="https://github.com/bunnyrams69/AI_Automation_Agent" target="_blank" style="color: #2563eb; font-weight: bold; text-decoration: underline;">https://github.com/bunnyrams69/AI_Automation_Agent</a></p>

  <div style="margin-top: 40px; display: flex; justify-content: space-between;">
    <div>
      <p style="margin: 0; font-weight: bold;">Gunda Ganesh</p>
      <p style="margin: 2px 0; color: #4b5563;">Dept. of CSE, Sathyabama</p>
    </div>
    <div>
      <p style="margin: 0; font-weight: bold;">Guddati Rosi</p>
      <p style="margin: 2px 0; color: #4b5563;">Dept. of CSE, Sathyabama</p>
    </div>
    <div>
      <p style="margin: 0; font-weight: bold;">Grandhi Karthik</p>
      <p style="margin: 2px 0; color: #4b5563;">Dept. of CSE, Sathyabama</p>
    </div>
  </div>

</div>
`;

  const plainContent = `SATHYABAMA INSTITUTE OF SCIENCE AND TECHNOLOGY
(Deemed to be University) • Chennai, Tamil Nadu
Department of Computer Science & Engineering
Academic Year: 2025 - 2026

PROJECT SUBMISSION REPORT
WhatsApp AI Lead Qualification & Site-Visit Booking Agent
An Autonomous Generative AI Assistant for Real Estate Lead Triage & Automated Appointment Scheduling

PROJECT AUTHORS / TEAM MEMBERS:
- Gunda Ganesh - B.E. Computer Science & Engineering
- Guddati Rosi - B.E. Computer Science & Engineering
- Grandhi Karthik - B.E. Computer Science & Engineering
Institution: Sathyabama Institute of Science and Technology, Chennai
Academic Year: 2025 - 2026

1. PROJECT SUBMISSION LINKS & DELIVERABLES (CLICKABLE ONLINE ACCESS):
- Public GitHub Repository: https://github.com/bunnyrams69/AI_Automation_Agent
- Presentation Deck (PPTX) - Online Viewer: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/WhatsApp_AI_Agent_Explainer.pptx
- Presentation Deck (PPTX) - Direct Download: https://github.com/bunnyrams69/AI_Automation_Agent/raw/main/docs/WhatsApp_AI_Agent_Explainer.pptx
- Live Test Screenshots Directory: https://github.com/bunnyrams69/AI_Automation_Agent/tree/main/docs/screenshots
- Automated Test Suite Proof Image: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/vitest_test_results.png

2. EXECUTIVE SUMMARY:
In real estate and site-visit-based businesses, customer leads are expensive. Over 60% of online leads are lost because inquiries arrive outside normal business hours when human representatives are unavailable.
Our project is an autonomous conversational agent operating 24/7 on WhatsApp. When an interested customer sends a message, our system immediately responds in natural English. It answers questions regarding available plots, prices, approvals, and amenities by querying a live database - it never invents fake discounts or hallucinated information. It understands colloquial Indian financial figures such as "85L", "1.5 Cr", or "2core", evaluates the buyer's purchase readiness into Cold, Warm, or Hot, shares the exact Google Maps location pin, checks available appointments in real time on Cal.com, books a confirmed physical site visit with free cab pickup, and instantly emails a full summary to the business owner.

3. ARCHITECTURE & 7-STEP PIPELINE:
1. Webhook Ingestion: Meta Cloud API sends HTTP POST webhook with HMAC-SHA256 signature verification.
2. Idempotent Deduplication: Supabase processed_messages table prevents duplicate replies.
3. Conversation Context Retrieval: Retrieves last 15 conversation turns from PostgreSQL.
4. Agentic Reasoning: Google Gemini 1.5 Flash evaluates context and selects from 10 registered tools.
5. Tool Execution: Fastify backend executes tool queries against Supabase or Cal.com.
6. Outbound Messaging: Synthesized message dispatched to user via Meta Graph API v21.0.
7. Lead Persistence & Alerting: Lead table updated; instant HTML email alert sent to owner.

4. THE 10 REGISTERED TOOLS:
1. lookup_inventory: Fetches plot specifications (dimensions, facing, sq.yd, price).
2. check_availability: Queries database for available units matching criteria.
3. get_project_amenities: Returns clubhouse, security, swimming pool, sports features.
4. get_rera_details: Provides RERA registration numbers and government sanctions.
5. get_location_details: Returns Google Maps coordinates and landmark distances.
6. parse_buyer_budget: Standardizes "80L" or "1.5cr" into integer rupees.
7. qualify_lead: Classifies buyer into Cold, Warm, or Hot.
8. get_available_booking_slots: Queries Cal.com API for real-time 45-min slots.
9. book_site_visit: Finalizes appointment on Cal.com and captures pickup location.
10. escalate_to_human: Halts AI automation and notifies human staff when needed.

5. LIVE DEMO RESULTS (5 WHATSAPP TURNS WITH PROOF LINKS):
- Turn 1: Buyer inquires about available plots; Agent lists Plots 10, 12, 15.
  Proof: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/01_greeting_plotsizes.png
- Turn 2: Buyer asks about Plot 12; Agent confirms 500 sq.yds, East-facing, 1.75 Cr.
  Proof: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/02_facing_plotchoice.png
- Turn 3: Buyer states budget "around 1.8 to 2 Cr, self-funded"; Agent qualifies as HOT lead.
  Proof: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/03_funding_qualification.png
- Turn 4: Buyer asks for location and visit; Agent shares Google Maps pin & Cal.com slots.
  Proof: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/04_maps_location_link.png
- Turn 5: Buyer picks Monday 2:30 PM with pickup at Gachibowli; Agent confirms booking BK-84729 and emails owner.
  Proof: https://github.com/bunnyrams69/AI_Automation_Agent/blob/main/docs/screenshots/05_booking_confirmed.png

6. TECH STACK:
Node.js v20+, TypeScript v5+, Fastify v5+, Google Gemini 1.5 Flash, Supabase PostgreSQL, Cal.com API v2, Meta WhatsApp Cloud API v21.0, Nodemailer SMTP, Vitest (61 tests).

7. STUDENT DECLARATION:
Submitted by Gunda Ganesh, Guddati Rosi, Grandhi Karthik
Department of Computer Science & Engineering
Sathyabama Institute of Science and Technology
Academic Year 2025 - 2026
GitHub: https://github.com/bunnyrams69/AI_Automation_Agent
`;

  // Navigate to Google Doc if page is closed or not at URL
  if (page.url() !== 'https://docs.google.com/document/d/1kZ_lEBkyQT8vThtfbGuOCRbu5WHz4T0PAn1ueZKUjyA/edit?tab=t.0' &&
      !page.url().includes('1kZ_lEBkyQT8vThtfbGuOCRbu5WHz4T0PAn1ueZKUjyA')) {
    await page.goto('https://docs.google.com/document/d/1kZ_lEBkyQT8vThtfbGuOCRbu5WHz4T0PAn1ueZKUjyA/edit?usp=sharing');
    await page.waitForTimeout(3000);
  }

  // Write to clipboard inside browser context
  await page.evaluate(({ htmlContent, plainContent }) => {
    const blobHtml = new Blob([htmlContent], { type: 'text/html' });
    const blobText = new Blob([plainContent], { type: 'text/plain' });
    return navigator.clipboard.write([
      new ClipboardItem({
        'text/html': blobHtml,
        'text/plain': blobText
      })
    ]);
  }, { htmlContent, plainContent });

  // Focus Google Docs editor canvas
  await page.locator('.kix-appview-editor').click();
  await page.waitForTimeout(300);

  // Select all and replace with pasted rich text
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(200);
  await page.keyboard.press('Backspace');
  await page.waitForTimeout(300);

  // Paste from clipboard
  await page.keyboard.press('Control+v');
  await page.waitForTimeout(4000);

  return "Successfully updated Google Doc with clickable online links!";
}
