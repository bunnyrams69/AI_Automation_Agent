const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

async function createDeck() {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches

  // Color Palette (Strict Hex without #)
  const NAVY_BG = '0B1220';      // Deep Dark Navy Background
  const CARD_BG = '111C30';      // Dark Slate Translucent Card
  const CARD_BORDER = '1E293B';  // Subtle Clean Border
  const TEXT_WHITE = 'FFFFFF';   // Pure White Primary Text
  const TEXT_MUTED = '94A3B8';   // Secondary Muted Text
  const TEXT_SUB = 'CBD5E1';     // Light Secondary Text
  const GREEN_ACCENT = '25D366'; // WhatsApp Brand Green
  const TEAL_ACCENT = '2DD4BF';  // Soft Secondary Teal
  const AMBER_ACCENT = 'FBBF24'; // Warning / Warm Accent
  const RED_ACCENT = 'F87171';   // Alert / Error Accent
  const FONT_PRIMARY = 'Poppins'; // Primary Modern Font Family

  // Base layout: navy background, project header tag, and slide number
  function applyBaseLayout(slide, slideLabel) {
    slide.background = { color: NAVY_BG };

    slide.addText('WhatsApp AI Lead Qualification & Site-Visit Booking Agent  |  Working Prototype', {
      x: 0.6,
      y: 5.18,
      w: 6.8,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: TEXT_MUTED,
      margin: 0
    });

    slide.addText(slideLabel, {
      x: 7.8,
      y: 5.18,
      w: 1.6,
      h: 0.3,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      align: 'right',
      margin: 0
    });
  }

  // Slide Header: 36-38pt title with small category badge
  function addSlideHeader(slide, titleText, subtitleText, tagText = null) {
    let titleY = 0.42;
    if (tagText) {
      slide.addText(tagText.toUpperCase(), {
        x: 0.6,
        y: 0.32,
        w: 8.8,
        h: 0.22,
        fontSize: 10,
        fontFace: FONT_PRIMARY,
        color: GREEN_ACCENT,
        bold: true,
        charSpacing: 2,
        margin: 0
      });
      titleY = 0.58;
    }

    slide.addText(titleText, {
      x: 0.6,
      y: titleY,
      w: 8.8,
      h: 0.55,
      fontSize: 36,
      fontFace: FONT_PRIMARY,
      color: TEXT_WHITE,
      bold: true,
      margin: 0
    });

    if (subtitleText) {
      slide.addText(subtitleText, {
        x: 0.6,
        y: titleY + 0.58,
        w: 8.8,
        h: 0.3,
        fontSize: 14,
        fontFace: FONT_PRIMARY,
        color: TEXT_MUTED,
        margin: 0
      });
    }
  }

  // ==========================================
  // SLIDE 1: TITLE SLIDE
  // ==========================================
  {
    const slide = pres.addSlide();
    slide.background = { color: NAVY_BG };

    // Pill Badge
    slide.addShape('roundRect', {
      x: 0.8,
      y: 0.65,
      w: 3.2,
      h: 0.35,
      rectRadius: 0.15,
      fill: { color: '0F2338' },
      line: { color: GREEN_ACCENT, width: 1 }
    });
    slide.addText('COLLEGE PROJECT SUBMISSION', {
      x: 0.8,
      y: 0.65,
      w: 3.2,
      h: 0.35,
      fontSize: 10,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      align: 'center',
      valign: 'middle',
      margin: 0
    });

    // Main Title: 38 pt bold
    slide.addText('WhatsApp AI Lead Qualification &\nSite-Visit Booking Agent', {
      x: 0.8,
      y: 1.15,
      w: 8.4,
      h: 1.45,
      fontSize: 38,
      fontFace: FONT_PRIMARY,
      color: TEXT_WHITE,
      bold: true,
      lineSpacing: 42,
      margin: 0
    });

    // Subtitle: 15 pt
    slide.addText('An AI agent for local plot and villa developers that chats on WhatsApp, answers questions from a knowledge base, qualifies leads, books real site visits via Cal.com, and emails the owner.', {
      x: 0.8,
      y: 2.7,
      w: 8.4,
      h: 0.7,
      fontSize: 15,
      fontFace: FONT_PRIMARY,
      color: TEXT_SUB,
      margin: 0
    });

    // Metadata Card
    slide.addShape('roundRect', {
      x: 0.6,
      y: 3.55,
      w: 8.8,
      h: 1.45,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText([
      { text: 'PROJECT AUTHORS (TEAM):\n', options: { fontSize: 9.5, color: GREEN_ACCENT, bold: true } },
      { text: '• Gunda Ganesh\n• Guddati Rosi\n• Grandhi Karthik', options: { fontSize: 11.5, color: TEXT_WHITE, bold: true, lineSpacing: 15 } }
    ], {
      x: 0.9,
      y: 3.7,
      w: 2.7,
      h: 1.2,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    slide.addText([
      { text: 'ACADEMIC PROGRAM & DEGREE:\n', options: { fontSize: 9.5, color: TEAL_ACCENT, bold: true } },
      { text: 'Sathyabama Institute of Science and Technology\n', options: { fontSize: 11.5, color: TEXT_WHITE, bold: true } },
      { text: 'Department of Computer Science & Engineering\nB.E. CSE', options: { fontSize: 10.5, color: TEXT_SUB } }
    ], {
      x: 3.8,
      y: 3.7,
      w: 3.2,
      h: 1.2,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    slide.addText([
      { text: 'ACADEMIC YEAR:\n', options: { fontSize: 9.5, color: TEXT_MUTED, bold: true } },
      { text: '2025 – 2026\n\n', options: { fontSize: 12, color: TEXT_WHITE, bold: true } },
      { text: 'PROJECT STATUS:\n', options: { fontSize: 9.5, color: TEXT_MUTED, bold: true } },
      { text: 'Working Prototype', options: { fontSize: 11, color: TEAL_ACCENT, bold: true } }
    ], {
      x: 7.2,
      y: 3.7,
      w: 2.0,
      h: 1.2,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    slide.addNotes(
      "Good morning, respected professors, panel members, and classmates. On behalf of our project team—Gunda Ganesh, Guddati Rosi, and Grandhi Karthik from Sathyabama B.E. Computer Science and Engineering—we present our final-year engineering project: the WhatsApp AI Lead Qualification and Site-Visit Booking Agent for the academic year 2025 to 2026. This working prototype automates inbound WhatsApp chat qualification and verified site-visit scheduling for local real estate developers. Let us examine the problem."
    );
  }

  // ==========================================
  // SLIDE 2: THE PROBLEM
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 02 of 15');
    addSlideHeader(slide, 'The Problem: High Lead Leakage', 'Digital ads drive high chat volume, but manual handling creates severe bottlenecks.', 'CHALLENGE OVERVIEW');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 4.5,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText([
      { text: 'High WhatsApp Ad Inquiries: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Dozens of inbound chats overwhelm sales reps daily.', options: { color: TEXT_SUB } }
    ], {
      x: 0.9,
      y: 1.75,
      w: 3.9,
      h: 0.65,
      fontSize: 16,
      fontFace: FONT_PRIMARY,
      bullet: true,
      margin: 0
    });

    slide.addText([
      { text: 'Slow First Response: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Hours of delay cause eager buyers to cool off or leave.', options: { color: TEXT_SUB } }
    ], {
      x: 0.9,
      y: 2.45,
      w: 3.9,
      h: 0.65,
      fontSize: 16,
      fontFace: FONT_PRIMARY,
      bullet: true,
      margin: 0
    });

    slide.addText([
      { text: 'Unclear Buyer Intent: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Reps waste time chasing casual window-shoppers.', options: { color: TEXT_SUB } }
    ], {
      x: 0.9,
      y: 3.15,
      w: 3.9,
      h: 0.65,
      fontSize: 16,
      fontFace: FONT_PRIMARY,
      bullet: true,
      margin: 0
    });

    slide.addText([
      { text: 'Manual Scheduling: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Clunky back-and-forth chat causes dropped site visits.', options: { color: TEXT_SUB } }
    ], {
      x: 0.9,
      y: 3.85,
      w: 3.9,
      h: 0.65,
      fontSize: 16,
      fontFace: FONT_PRIMARY,
      bullet: true,
      margin: 0
    });

    slide.addShape('roundRect', {
      x: 5.3,
      y: 1.55,
      w: 4.1,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Before: The Manual Failure Flow', {
      x: 5.55,
      y: 1.72,
      w: 3.6,
      h: 0.35,
      fontSize: 14,
      fontFace: FONT_PRIMARY,
      color: RED_ACCENT,
      bold: true,
      margin: 0
    });

    const flowItems = [
      { step: '1', title: 'Buyer Clicks Meta Ad', desc: 'Sends inbound WhatsApp inquiry.' },
      { step: '2', title: 'Hours of Silence & Delay', desc: 'No instant reply; customer interest cools.' },
      { step: '3', title: 'Cluttered Manual Chat', desc: 'Sales rep asks ad-hoc questions.' },
      { step: '4', title: 'Lead Drops Off & Lost Sale', desc: 'Buyer visits competitor; zero visit booked.' }
    ];

    flowItems.forEach((item, idx) => {
      const itemY = 2.15 + (idx * 0.65);
      slide.addShape('ellipse', {
        x: 5.55,
        y: itemY + 0.05,
        w: 0.28,
        h: 0.28,
        fill: { color: '2A1515' },
        line: { color: RED_ACCENT, width: 1 }
      });
      slide.addText(item.step, {
        x: 5.55,
        y: itemY + 0.05,
        w: 0.28,
        h: 0.28,
        fontSize: 10,
        fontFace: FONT_PRIMARY,
        color: RED_ACCENT,
        bold: true,
        align: 'center',
        valign: 'middle',
        margin: 0
      });

      slide.addText([
        { text: item.title + '\n', options: { fontSize: 11, bold: true, color: TEXT_WHITE } },
        { text: item.desc, options: { fontSize: 9.5, color: TEXT_MUTED } }
      ], {
        x: 5.95,
        y: itemY,
        w: 3.2,
        h: 0.55,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    slide.addNotes(
      "Real estate developers spend significantly on Meta and Google ads that drive potential buyers directly to WhatsApp. However, because responses depend entirely on manual sales staff, incoming chats often remain unanswered for several hours or overnight. By the time a sales representative replies, the customer has cooled off or reached out to a competitor. Furthermore, sales teams waste valuable time conversing with casual browsers. Without quick qualification and easy scheduling, promising leads are regularly lost."
    );
  }

  // ==========================================
  // SLIDE 3: THE SOLUTION
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 03 of 15');
    addSlideHeader(slide, 'The Solution: Automated Qualification', 'Instant conversational responses that qualify buying intent and book verified site visits.', 'SYSTEM OVERVIEW');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 8.8,
      h: 0.75,
      rectRadius: 0.08,
      fill: { color: '0F2826' },
      line: { color: GREEN_ACCENT, width: 1 }
    });
    slide.addText('Core Concept: An AI agent that engages WhatsApp leads instantly, scores their buying readiness, and books live calendar visits automatically.', {
      x: 0.85,
      y: 1.62,
      w: 8.3,
      h: 0.6,
      fontSize: 15,
      fontFace: FONT_PRIMARY,
      color: TEXT_WHITE,
      bold: true,
      valign: 'middle',
      margin: 0
    });

    const outcomes = [
      { title: 'Instant Replies', desc: 'Answers questions in seconds 24/7 using verified plot catalog data.' },
      { title: 'Lead Scoring', desc: 'Categorizes buyers into Cold, Warm, or Hot based on budget and timeline.' },
      { title: 'Real Booking', desc: 'Checks live slots and books confirmed site visits atomically via Cal.com.' },
      { title: 'Owner Alerts', desc: 'Sends immediate email summaries with qualification notes and visit details.' }
    ];

    outcomes.forEach((card, idx) => {
      const cardX = 0.6 + (idx * 2.25);
      slide.addShape('roundRect', {
        x: cardX,
        y: 2.45,
        w: 2.15,
        h: 1.35,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addText(card.title, {
        x: cardX + 0.15,
        y: 2.58,
        w: 1.85,
        h: 0.3,
        fontSize: 13,
        fontFace: FONT_PRIMARY,
        color: TEAL_ACCENT,
        bold: true,
        margin: 0
      });

      slide.addText(card.desc, {
        x: cardX + 0.15,
        y: 2.92,
        w: 1.85,
        h: 0.75,
        fontSize: 9.5,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 0.6,
      y: 3.95,
      w: 8.8,
      h: 0.95,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('After: The Automated Workflow', {
      x: 0.8,
      y: 4.02,
      w: 8.4,
      h: 0.22,
      fontSize: 10.5,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      margin: 0
    });

    const stepsAfter = [
      '1. Inbound Lead Chat',
      '2. Instant AI Response',
      '3. Intent Qualification',
      '4. Cal.com Visit Booked',
      '5. Owner Alert Emailed'
    ];

    stepsAfter.forEach((s, idx) => {
      const sX = 0.8 + (idx * 1.7);
      slide.addShape('roundRect', {
        x: sX,
        y: 4.3,
        w: 1.6,
        h: 0.42,
        rectRadius: 0.05,
        fill: { color: '16263D' },
        line: { color: '2B4163', width: 1 }
      });
      slide.addText(s, {
        x: sX,
        y: 4.3,
        w: 1.6,
        h: 0.42,
        fontSize: 9,
        fontFace: FONT_PRIMARY,
        color: TEXT_WHITE,
        align: 'center',
        valign: 'middle',
        bold: true,
        margin: 0
      });
    });

    slide.addNotes(
      "Our solution replaces the broken manual workflow with a continuous automated pipeline. When a customer messages our WhatsApp number, the Fastify server and Gemini AI agent respond within seconds. The agent conducts a polite, structured conversation to assess budget and timeline, checks real-time availability on Cal.com, completes an atomic site-visit reservation, and alerts the business owner by email. This guarantees zero lead leakage and frees the sales team to focus on high-priority buyers."
    );
  }

  // ==========================================
  // SLIDE 4: LIVE RESULTS (PART 1)
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 04 of 15');
    addSlideHeader(slide, 'Live Results: Lead Intake & Discovery', 'Real WhatsApp test turn showing instant greeting, catalog query, and buyer preference capture.', 'LIVE DEMO EVIDENCE');

    // Left Column: Screenshots 1 and 2
    slide.addImage({
      path: path.resolve('docs/screenshots/01_greeting_plotsizes.png'),
      x: 0.6,
      y: 1.55,
      w: 4.8,
      h: 1.6
    });

    slide.addImage({
      path: path.resolve('docs/screenshots/02_facing_plotchoice.png'),
      x: 0.6,
      y: 3.25,
      w: 4.8,
      h: 1.65
    });

    // Right Column: Analysis Card
    slide.addShape('roundRect', {
      x: 5.6,
      y: 1.55,
      w: 3.8,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Turn Analysis & Tool Execution', {
      x: 5.85,
      y: 1.72,
      w: 3.3,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      margin: 0
    });

    const points = [
      { bold: 'Instant Intake: ', text: 'Replies in seconds welcoming lead to Apex Green Estates with visit context.' },
      { bold: 'Dynamic Database Lookup: ', text: 'Calls get_site_details to retrieve exact sizes (167 to 500 sq.yds) from Supabase.' },
      { bold: 'Facing Preference Captured: ', text: 'Shortlists East-facing plots upon lead request for Monday visit.' },
      { bold: 'Unit Size Selection: ', text: 'Customer selects 500 sq.yds; agent locks choice into session memory.' },
      { bold: 'Zero Hallucinations: ', text: 'All plot metrics match verified database records with zero guessing.' }
    ];

    points.forEach((p, idx) => {
      const pY = 2.12 + (idx * 0.52);
      slide.addText([
        { text: p.bold, options: { bold: true, color: TEXT_WHITE } },
        { text: p.text, options: { color: TEXT_SUB } }
      ], {
        x: 5.85,
        y: pY,
        w: 3.3,
        h: 0.48,
        fontSize: 9.5,
        fontFace: FONT_PRIMARY,
        bullet: true,
        margin: 0
      });
    });

    slide.addNotes(
      "On this slide, we examine the live results from our WhatsApp test session. When the lead sends an initial greeting, the agent immediately responds with property context and welcomes the customer to Apex Green Estates. When the buyer inquires about plot sizes, the agent queries our Supabase catalog and returns the exact range of one hundred sixty-seven to five hundred square yards. The lead then specifies an East-facing five hundred square yard plot, which our agent records."
    );
  }

  // ==========================================
  // SLIDE 5: LIVE RESULTS (PART 2)
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 05 of 15');
    addSlideHeader(slide, 'Live Results: Qualification & Media Delivery', 'Assessing financing mode, sharing project directions, and delivering interactive Google Maps card.', 'QUALIFICATION & MEDIA');

    // Left Column: Screenshots 3 and 4
    slide.addImage({
      path: path.resolve('docs/screenshots/03_funding_qualification.png'),
      x: 0.6,
      y: 1.55,
      w: 4.8,
      h: 1.6
    });

    slide.addImage({
      path: path.resolve('docs/screenshots/04_maps_location_link.png'),
      x: 0.6,
      y: 3.25,
      w: 4.8,
      h: 1.65
    });

    // Right Column: Analysis Card
    slide.addShape('roundRect', {
      x: 5.6,
      y: 1.55,
      w: 3.8,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Qualification & Logistics Highlights', {
      x: 5.85,
      y: 1.72,
      w: 3.3,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT_PRIMARY,
      color: TEAL_ACCENT,
      bold: true,
      margin: 0
    });

    const points2 = [
      { bold: 'Financial Qualification: ', text: 'Agent proactively asks: self-funding vs bank loan assistance.' },
      { bold: 'PostgreSQL Update: ', text: 'Executes update_lead tool to score buyer as verified self-funded.' },
      { bold: 'Multi-Media Dispatch: ', text: 'Sends site layout masterplans via WhatsApp Cloud media API.' },
      { bold: 'Google Maps Card: ', text: 'Generates live Google Maps pin for Emerald Meadows on Shankarpally Highway.' },
      { bold: 'Concierge Coordination: ', text: 'Notifies lead that an executive will coordinate cab pickup from Gachibowli.' }
    ];

    points2.forEach((p, idx) => {
      const pY = 2.12 + (idx * 0.52);
      slide.addText([
        { text: p.bold, options: { bold: true, color: TEXT_WHITE } },
        { text: p.text, options: { color: TEXT_SUB } }
      ], {
        x: 5.85,
        y: pY,
        w: 3.3,
        h: 0.48,
        fontSize: 9.5,
        fontFace: FONT_PRIMARY,
        bullet: true,
        margin: 0
      });
    });

    slide.addNotes(
      "Continuing the live test turn, the agent proceeds to financial qualification by asking whether the purchase will be self-funded or bank-financed. When the buyer confirms self-funding, the database lead record is immediately updated with this score. Next, the agent shares property images, detailed directions along Shankarpally Highway, and an interactive Google Maps location card. This demonstrates how generative AI combines structured data qualification with rich visual media delivery directly within the WhatsApp interface."
    );
  }

  // ==========================================
  // SLIDE 6: LIVE RESULTS (PART 3)
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 06 of 15');
    addSlideHeader(slide, 'Live Results: Confirmed Visit & Calendar Lock', 'Final atomic booking confirmation dispatched on WhatsApp with complete visit logistics.', 'CONFIRMED BOOKING');

    // Top: Screenshot 5 (Full Booking Confirmation)
    slide.addImage({
      path: path.resolve('docs/screenshots/05_booking_confirmed.png'),
      x: 0.8,
      y: 1.55,
      w: 8.4,
      h: 1.65
    });

    // Bottom: 3 Verification Highlights Cards
    const pillars = [
      {
        title: '1. Cal.com Calendar Lock',
        color: GREEN_ACCENT,
        desc: '• Slot reserved atomically via Cal.com API v2.\n• Confirmed for Monday, 19 Oct at 2:30 PM IST.\n• Zero double-booking or slot collision risk.'
      },
      {
        title: '2. Automated Owner Alert',
        color: TEAL_ACCENT,
        desc: '• Instant email sent to business owner inbox.\n• Includes buyer name, budget, plot choice, & time.\n• Direct Cal.com appointment inspection link.'
      },
      {
        title: '3. Concierge Logistics',
        color: AMBER_ACCENT,
        desc: '• Complimentary cab pickup from Gachibowli.\n• Executive coordination scheduled prior to visit.\n• Email confirmation offered and queued.'
      }
    ];

    pillars.forEach((p, idx) => {
      const pX = 0.8 + (idx * 2.9);
      slide.addShape('roundRect', {
        x: pX,
        y: 3.35,
        w: 2.65,
        h: 1.55,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addText(p.title, {
        x: pX + 0.15,
        y: 3.48,
        w: 2.35,
        h: 0.28,
        fontSize: 11,
        fontFace: FONT_PRIMARY,
        color: p.color,
        bold: true,
        margin: 0
      });

      slide.addText(p.desc, {
        x: pX + 0.15,
        y: 3.8,
        w: 2.35,
        h: 0.95,
        fontSize: 8.5,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        lineSpacing: 12,
        margin: 0
      });
    });

    slide.addNotes(
      "Finally, here is the confirmed site-visit booking result. The agent locks in the appointment for Monday, October nineteenth at two-thirty PM IST under Test Customer, with a complimentary cab pickup arranged from Gachibowli. The agent also offers to dispatch a formal email confirmation. Notice that this message is only dispatched after Cal.com confirms the slot atomically. This proves the full end-to-end loop: intake, qualification, media delivery, and verified calendar scheduling without human intervention."
    );
  }

  // ==========================================
  // SLIDE 7: SYSTEM ARCHITECTURE
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 07 of 15');
    addSlideHeader(slide, 'System Architecture & Data Flow', 'Bidirectional message flow across Meta Cloud API, Fastify server, Supabase, and Cal.com', 'ARCHITECTURE');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 8.8,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    // Box 1: Lead
    slide.addShape('roundRect', {
      x: 0.9,
      y: 2.35,
      w: 1.4,
      h: 1.3,
      rectRadius: 0.08,
      fill: { color: '16263D' },
      line: { color: '2B4163', width: 1 }
    });
    slide.addText([
      { text: 'LEAD\n', options: { fontSize: 12, bold: true, color: TEXT_WHITE } },
      { text: 'Customer on\nWhatsApp\nMobile / Web', options: { fontSize: 9.5, color: TEXT_MUTED } }
    ], {
      x: 0.9,
      y: 2.5,
      w: 1.4,
      h: 1.0,
      fontFace: FONT_PRIMARY,
      align: 'center',
      margin: 0
    });

    slide.addText('< ---- >', {
      x: 2.3,
      y: 2.8,
      w: 0.7,
      h: 0.3,
      fontSize: 12,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      align: 'center',
      margin: 0
    });

    // Box 2: WhatsApp Cloud API
    slide.addShape('roundRect', {
      x: 3.0,
      y: 2.35,
      w: 1.6,
      h: 1.3,
      rectRadius: 0.08,
      fill: { color: '0B3828' },
      line: { color: GREEN_ACCENT, width: 1 }
    });
    slide.addText([
      { text: 'WhatsApp Cloud API\n', options: { fontSize: 11, bold: true, color: GREEN_ACCENT } },
      { text: '(Meta Gateway)\n• Webhooks Out\n• Graph API In', options: { fontSize: 9, color: TEXT_WHITE } }
    ], {
      x: 3.0,
      y: 2.5,
      w: 1.6,
      h: 1.0,
      fontFace: FONT_PRIMARY,
      align: 'center',
      margin: 0
    });

    slide.addText('< ---- >', {
      x: 4.6,
      y: 2.8,
      w: 0.7,
      h: 0.3,
      fontSize: 12,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      align: 'center',
      margin: 0
    });

    // Central Box: Backend Core
    slide.addShape('roundRect', {
      x: 5.3,
      y: 1.7,
      w: 2.1,
      h: 2.85,
      rectRadius: 0.08,
      fill: { color: '142338' },
      line: { color: TEAL_ACCENT, width: 1 }
    });

    slide.addText('CORE BACKEND', {
      x: 5.3,
      y: 1.85,
      w: 2.1,
      h: 0.25,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: TEAL_ACCENT,
      bold: true,
      align: 'center',
      margin: 0
    });

    const backendBlocks = [
      { name: 'Fastify Server', desc: 'HMAC Webhook Verify' },
      { name: 'Debounce Queue', desc: '3s Burst Accumulator' },
      { name: 'Gemini AI Agent', desc: 'Function Calling Engine' }
    ];

    backendBlocks.forEach((b, idx) => {
      const bY = 2.15 + (idx * 0.75);
      slide.addShape('roundRect', {
        x: 5.45,
        y: bY,
        w: 1.8,
        h: 0.65,
        rectRadius: 0.05,
        fill: { color: '0D1A2D' },
        line: { color: '1E3352', width: 1 }
      });
      slide.addText([
        { text: b.name + '\n', options: { fontSize: 10, bold: true, color: TEXT_WHITE } },
        { text: b.desc, options: { fontSize: 8.5, color: TEXT_MUTED } }
      ], {
        x: 5.45,
        y: bY + 0.08,
        w: 1.8,
        h: 0.5,
        fontFace: FONT_PRIMARY,
        align: 'center',
        margin: 0
      });
    });

    // Right Box: External Integrations Stack
    const externalServices = [
      { name: 'Supabase PostgreSQL', role: 'Leads, Catalog, Events & RLS' },
      { name: 'Cal.com API', role: 'Real-time Slot Booking' },
      { name: 'Nodemailer SMTP', role: 'Owner Lead Alerts' },
      { name: 'Admin REST API', role: 'Inspection & Metrics' }
    ];

    externalServices.forEach((s, idx) => {
      const sY = 1.65 + (idx * 0.78);
      slide.addShape('roundRect', {
        x: 7.7,
        y: sY,
        w: 1.5,
        h: 0.68,
        rectRadius: 0.05,
        fill: { color: '16263D' },
        line: { color: '2B4163', width: 1 }
      });
      slide.addText([
        { text: s.name + '\n', options: { fontSize: 9.5, bold: true, color: TEXT_WHITE } },
        { text: s.role, options: { fontSize: 8, color: TEXT_MUTED } }
      ], {
        x: 7.7,
        y: sY + 0.08,
        w: 1.5,
        h: 0.52,
        fontFace: FONT_PRIMARY,
        align: 'center',
        margin: 0
      });
    });

    slide.addNotes(
      "Here is our system architecture diagram. A lead sends a WhatsApp message which reaches Meta's WhatsApp Cloud API. Meta triggers our Fastify backend webhook over an HTTPS tunnel. The server cryptographically validates the signature, stores the event in Supabase, and pushes it into an in-memory queue with a three-second debounce window. Our worker claims the job and executes the Gemini AI agent. The agent calls registered tools to query Supabase, check Cal.com slots, send replies via Meta's Graph API, and email the owner."
    );
  }

  // ==========================================
  // SLIDE 8: HOW ONE MESSAGE IS PROCESSED
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 08 of 15');
    addSlideHeader(slide, 'How One Message is Processed: The 7-Step Pipeline', 'From inbound HTTP webhook to asynchronous AI execution and confirmed response dispatch.', 'PIPELINE WALKTHROUGH');

    const steps = [
      { num: '1', title: 'Webhook Received & Verified', desc: 'Fastify endpoint validates the HMAC-SHA256 signature in the x-hub-signature-256 header using the Meta app secret.' },
      { num: '2', title: 'Persisted to Database Queue', desc: 'The raw JSON payload is recorded in inbound_events table and acknowledged to Meta with 200 OK in under 200ms.' },
      { num: '3', title: 'Worker Debounce & Claim', desc: 'An asynchronous worker waits 3 seconds to aggregate rapid successive messages, then acquires an atomic row lock.' },
      { num: '4', title: 'Audio Transcription Check', desc: 'If the incoming message is an audio voice note, Gemini multimodal audio API transcribes it into text before proceeding.' },
      { num: '5', title: 'Agent Tool Execution Loop', desc: 'Gemini reasoning evaluates conversation history and invokes specific registered tools (knowledge, scoring, calendar).' },
      { num: '6', title: 'WhatsApp Reply Dispatched', desc: 'The formatted text and optional media attachments are sent back to the customer via Meta WhatsApp Cloud API.' },
      { num: '7', title: 'Owner Notification & Audit', desc: 'Lead status updates trigger an instant email summary to the business owner, and actions are logged to audit_log.' }
    ];

    steps.slice(0, 4).forEach((st, idx) => {
      const sY = 1.55 + (idx * 0.8);
      slide.addShape('roundRect', {
        x: 0.6,
        y: sY,
        w: 4.3,
        h: 0.72,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addShape('ellipse', {
        x: 0.75,
        y: sY + 0.16,
        w: 0.38,
        h: 0.38,
        fill: { color: '0D3325' },
        line: { color: GREEN_ACCENT, width: 1 }
      });
      slide.addText(st.num, {
        x: 0.75,
        y: sY + 0.16,
        w: 0.38,
        h: 0.38,
        fontSize: 12,
        fontFace: FONT_PRIMARY,
        color: GREEN_ACCENT,
        bold: true,
        align: 'center',
        valign: 'middle',
        margin: 0
      });

      slide.addText([
        { text: st.title + '\n', options: { fontSize: 11, bold: true, color: TEXT_WHITE } },
        { text: st.desc, options: { fontSize: 8.5, color: TEXT_MUTED } }
      ], {
        x: 1.25,
        y: sY + 0.06,
        w: 3.5,
        h: 0.6,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    steps.slice(4).forEach((st, idx) => {
      const sY = 1.55 + (idx * 1.08);
      slide.addShape('roundRect', {
        x: 5.1,
        y: sY,
        w: 4.3,
        h: 0.98,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addShape('ellipse', {
        x: 5.25,
        y: sY + 0.28,
        w: 0.38,
        h: 0.38,
        fill: { color: '0F2838' },
        line: { color: TEAL_ACCENT, width: 1 }
      });
      slide.addText(st.num, {
        x: 5.25,
        y: sY + 0.28,
        w: 0.38,
        h: 0.38,
        fontSize: 12,
        fontFace: FONT_PRIMARY,
        color: TEAL_ACCENT,
        bold: true,
        align: 'center',
        valign: 'middle',
        margin: 0
      });

      slide.addText([
        { text: st.title + '\n', options: { fontSize: 11.5, bold: true, color: TEXT_WHITE } },
        { text: st.desc, options: { fontSize: 9.5, color: TEXT_MUTED } }
      ], {
        x: 5.75,
        y: sY + 0.1,
        w: 3.5,
        h: 0.78,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    slide.addNotes(
      "To understand how a message moves through the system, we trace seven sequential steps. A webhook is an automated HTTP callback sent when an event occurs. When Meta hits our webhook, we verify its signature to reject unauthorized requests. We store the raw payload and immediately reply with HTTP 200 so Meta does not retry. A background worker waits three seconds to group rapid messages, transcribes voice notes if needed, runs the Gemini agent with tools, sends the WhatsApp reply, and alerts the owner."
    );
  }

  // ==========================================
  // SLIDE 9: THE AI AGENT & FUNCTION CALLING
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 09 of 15');
    addSlideHeader(slide, 'The AI Agent: Function Calling in Plain Language', 'Strict architectural separation: The language model decides; our code executes.', 'INTELLIGENCE LAYER');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 8.8,
      h: 0.65,
      rectRadius: 0.08,
      fill: { color: '142338' },
      line: { color: TEAL_ACCENT, width: 1 }
    });
    slide.addText([
      { text: 'WHAT IS FUNCTION CALLING?  ', options: { bold: true, color: TEAL_ACCENT, fontSize: 11 } },
      { text: 'The AI model never touches external APIs directly. The model asks for an action in structured JSON ("Call book_site_visit with slot 10 AM"); our TypeScript code validates permissions, executes the API call, and passes the result back to the model.', options: { color: TEXT_WHITE, fontSize: 10 } }
    ], {
      x: 0.8,
      y: 1.58,
      w: 8.4,
      h: 0.58,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    const toolGroups = [
      {
        group: '1. Knowledge & Site Lookup (3 Tools)',
        color: GREEN_ACCENT,
        tools: '• search_knowledge: Queries FAQ database\n• list_sites: Fetches active projects from DB\n• get_site_details: Retrieves pricing & unit sizes'
      },
      {
        group: '2. Media Delivery (1 Tool)',
        color: TEAL_ACCENT,
        tools: '• send_site_images: Sends verified property photos, layout masterplans, and site maps via WhatsApp media messages.'
      },
      {
        group: '3. Lead Management (2 Tools)',
        color: AMBER_ACCENT,
        tools: '• update_lead: Updates budget, timeline, & purpose\n• classify_lead: Assigns Cold, Warm, or Hot rating based on verified conversation criteria.'
      },
      {
        group: '4. Calendar & Handoff (4 Tools)',
        color: '60A5FA',
        tools: '• check_availability: Live slots via Cal.com\n• book_site_visit: Atomic calendar lock\n• reschedule_or_cancel_visit: Modifies visits\n• handoff_to_human: Flags complex inquiries'
      }
    ];

    toolGroups.forEach((tg, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const tX = 0.6 + (col * 4.5);
      const tY = 2.3 + (row * 1.15);

      slide.addShape('roundRect', {
        x: tX,
        y: tY,
        w: 4.3,
        h: 1.05,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addText(tg.group, {
        x: tX + 0.15,
        y: tY + 0.08,
        w: 4.0,
        h: 0.25,
        fontSize: 10.5,
        fontFace: FONT_PRIMARY,
        color: tg.color,
        bold: true,
        margin: 0
      });

      slide.addText(tg.tools, {
        x: tX + 0.15,
        y: tY + 0.32,
        w: 4.0,
        h: 0.65,
        fontSize: 9,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        lineSpacing: 13,
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 0.6,
      y: 4.62,
      w: 8.8,
      h: 0.42,
      rectRadius: 0.05,
      fill: { color: '0A281E' },
      line: { color: GREEN_ACCENT, width: 1 }
    });
    slide.addText('Factual Guardrail: The agent answers only from stored Supabase database records. It never hallucinates prices or unverified amenities.', {
      x: 0.8,
      y: 4.62,
      w: 8.4,
      h: 0.42,
      fontSize: 9.5,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      valign: 'middle',
      margin: 0
    });

    slide.addNotes(
      "Let us define function calling in simple terms: the AI model asks, and our code does. In this architecture, the Gemini model never accesses our database or the internet directly. Instead, the model issues a structured request asking to run a specific function with parameters. Our TypeScript code inspects the request, queries Supabase or Cal.com, and feeds the factual result back. Across ten registered tools, the agent is strictly prohibited from guessing; it answers only from verified database records."
    );
  }

  // ==========================================
  // SLIDE 10: LEAD QUALIFICATION & BUDGET PARSER
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 10 of 15');
    addSlideHeader(slide, 'Lead Qualification: The 4-Question Scoring Engine', 'Categorizing leads into Cold, Warm, and Hot tiers with colloquial Indian budget normalization.', 'QUALIFICATION LOGIC');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 8.8,
      h: 0.5,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });
    slide.addText([
      { text: 'STRUCTURED QUESTION ORDER:  ', options: { bold: true, color: GREEN_ACCENT, fontSize: 10 } },
      { text: '1. Budget Range  ->  2. Purchase Timeline  ->  3. Purchase Purpose (Self-use / Investment)  ->  4. Financing Mode', options: { color: TEXT_WHITE, fontSize: 10 } }
    ], {
      x: 0.8,
      y: 1.55,
      w: 8.4,
      h: 0.5,
      fontFace: FONT_PRIMARY,
      valign: 'middle',
      margin: 0
    });

    const tiers = [
      {
        tier: 'COLD LEAD',
        color: TEXT_MUTED,
        badgeBg: '162238',
        borderColor: '2B3B52',
        criteria: '• Just browsing or exploratory\n• No defined timeline (> 6 months)\n• Unwilling to share budget\n• Action: Polite automated answers, no sales escalation'
      },
      {
        tier: 'WARM LEAD',
        color: AMBER_ACCENT,
        badgeBg: '2D220E',
        borderColor: '59441B',
        criteria: '• Concrete interest & known budget\n• Timeline within 1 to 3 months\n• Exploring multiple site options\n• Action: Offer brochure, follow up in 24 hours'
      },
      {
        tier: 'HOT LEAD',
        color: GREEN_ACCENT,
        badgeBg: '0B281B',
        borderColor: '155737',
        criteria: '• Immediate buying intent (< 30 days)\n• Clear budget matching available inventory\n• Requests or agrees to in-person site visit\n• Action: Immediate Cal.com booking & email alert'
      }
    ];

    tiers.forEach((tr, idx) => {
      const cX = 0.6 + (idx * 3.0);
      slide.addShape('roundRect', {
        x: cX,
        y: 2.15,
        w: 2.8,
        h: 1.85,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: tr.borderColor, width: 1 }
      });

      slide.addShape('roundRect', {
        x: cX + 0.15,
        y: 2.25,
        w: 2.5,
        h: 0.35,
        rectRadius: 0.05,
        fill: { color: tr.badgeBg }
      });
      slide.addText(tr.tier, {
        x: cX + 0.15,
        y: 2.25,
        w: 2.5,
        h: 0.35,
        fontSize: 11,
        fontFace: FONT_PRIMARY,
        color: tr.color,
        bold: true,
        align: 'center',
        valign: 'middle',
        margin: 0
      });

      slide.addText(tr.criteria, {
        x: cX + 0.15,
        y: 2.7,
        w: 2.5,
        h: 1.2,
        fontSize: 9,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        lineSpacing: 13,
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 0.6,
      y: 4.12,
      w: 8.8,
      h: 0.85,
      rectRadius: 0.08,
      fill: { color: '102033' },
      line: { color: TEAL_ACCENT, width: 1 }
    });

    slide.addText([
      { text: 'INDIAN BUDGET PARSER (Regex & Numeric Normalizer in Code):\n', options: { fontSize: 10, bold: true, color: TEAL_ACCENT } },
      { text: 'Buyers write colloquially: "1core" -> parsed as ₹1,00,00,000 | "50-60 lakhs" -> parsed as ₹50,00,000 - ₹60,00,000 | "80L" -> ₹80,00,000.\nOur custom parser maps local Indian terminology into clean numerical integers so lead filtering works deterministically.', options: { fontSize: 9.5, color: TEXT_WHITE } }
    ], {
      x: 0.8,
      y: 4.18,
      w: 8.4,
      h: 0.72,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    slide.addNotes(
      "Lead qualification follows a structured sequence: budget, timeline, purchase purpose, and financing mode. The agent assigns every buyer to Cold, Warm, or Hot tiers using strict criteria. Hot leads exhibit immediate intent and book visits. Warm leads have valid budgets but longer purchase timelines, while Cold leads are casual browsers. A critical feature is our custom Indian budget parser: it accurately converts informal inputs like '1core', '80L', or '50-60 lakhs' into numeric rupee values for precise filtering."
    );
  }

  // ==========================================
  // SLIDE 11: BOOKING & NOTIFICATIONS
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 11 of 15');
    addSlideHeader(slide, 'Live Booking & Real-Time Notification Architecture', 'Atomic calendar reservation with Cal.com and automated owner alerts respecting WhatsApp policies.', 'BOOKING ENGINE');

    const pillars = [
      {
        title: '1. Cal.com Live Slots',
        subtitle: 'Dynamic Availability',
        color: TEAL_ACCENT,
        desc: '• Agent queries live available slots via Cal.com API v2.\n• Respects developer schedule, buffer times, and holidays.\n• No double bookings or scheduling conflicts.'
      },
      {
        title: '2. Atomic Booking',
        subtitle: 'Guaranteed Confirmation',
        color: GREEN_ACCENT,
        desc: '• The agent requests a slot lock via API.\n• Confirmation message sent ONLY after Cal.com returns booking ID.\n• Webhook keeps Supabase in sync if rescheduled via email.'
      },
      {
        title: '3. Owner Lead Alerts',
        subtitle: 'Zero Lead Leakage',
        color: AMBER_ACCENT,
        desc: '• Instant email sent to developer when Hot lead emerges.\n• Includes buyer name, phone, budget, timeline, and slot.\n• Direct link to view booking in Cal.com dashboard.'
      }
    ];

    pillars.forEach((p, idx) => {
      const pX = 0.6 + (idx * 3.0);
      slide.addShape('roundRect', {
        x: pX,
        y: 1.55,
        w: 2.8,
        h: 2.15,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addText(p.title, {
        x: pX + 0.15,
        y: 1.7,
        w: 2.5,
        h: 0.3,
        fontSize: 12,
        fontFace: FONT_PRIMARY,
        color: p.color,
        bold: true,
        margin: 0
      });

      slide.addText(p.subtitle, {
        x: pX + 0.15,
        y: 2.0,
        w: 2.5,
        h: 0.25,
        fontSize: 9.5,
        fontFace: FONT_PRIMARY,
        color: TEXT_MUTED,
        margin: 0
      });

      slide.addText(p.desc, {
        x: pX + 0.15,
        y: 2.35,
        w: 2.5,
        h: 1.25,
        fontSize: 9,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        lineSpacing: 13,
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 0.6,
      y: 3.85,
      w: 8.8,
      h: 1.15,
      rectRadius: 0.08,
      fill: { color: '142033' },
      line: { color: '203A5E', width: 1 }
    });

    slide.addText('WhatsApp Platform Compliance: The 24-Hour Messaging Window', {
      x: 0.8,
      y: 3.96,
      w: 8.4,
      h: 0.25,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      margin: 0
    });

    slide.addText([
      { text: '• Customer-Initiated Window: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Meta allows free-form conversational replies only within 24 hours of the lead\'s last incoming message.\n', options: { color: TEXT_SUB } },
      { text: '• Post-24h Template Messages: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Site-visit reminders scheduled for days ahead use Meta-approved pre-registered message templates.\n', options: { color: TEXT_SUB } },
      { text: '• Fail-Safe Outbox: ', options: { bold: true, color: TEXT_WHITE } },
      { text: 'Outbound notifications are staged in database tables so connection glitches never result in lost messages.', options: { color: TEXT_SUB } }
    ], {
      x: 0.8,
      y: 4.22,
      w: 8.4,
      h: 0.7,
      fontSize: 9,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    slide.addNotes(
      "Scheduling site visits requires atomic accuracy. We integrate directly with Cal.com's live API to query available slots based on the real estate team's calendar. WhatsApp confirmation is strictly atomic: the confirmation message is sent only after Cal.com verifies the booking ID. If a user reschedules or cancels via email, Cal.com webhooks keep our database synchronized. Furthermore, all follow-up reminders respect WhatsApp's mandatory twenty-four-hour customer service window by utilizing pre-approved Meta message templates."
    );
  }

  // ==========================================
  // SLIDE 12: RELIABILITY AND SECURITY
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 12 of 15');
    addSlideHeader(slide, 'System Reliability, Resilience & Security', 'Defensive engineering safeguards: webhook verification, concurrency control, and prompt defenses.', 'DEFENSIVE ENGINEERING');

    const securityItems = [
      {
        title: 'Signed Webhooks',
        tag: 'HMAC-SHA256',
        desc: 'Verifies Meta app secret signatures; rejects spoofed requests instantly.'
      },
      {
        title: 'Decoupled Queue',
        tag: 'Fast 200 OK',
        desc: 'Meta receives a 200 OK under 200ms; worker processes asynchronously.'
      },
      {
        title: 'Duplicate Protection',
        tag: 'Idempotency',
        desc: 'Inbound message IDs tracked in PostgreSQL; duplicate deliveries ignored.'
      },
      {
        title: 'Burst Debounce',
        tag: '3-Second Window',
        desc: 'Aggregates rapid multi-message bursts into a single unified agent turn.'
      },
      {
        title: 'Database RLS',
        tag: 'Supabase Security',
        desc: 'Row-level security policies isolate customer data across all tables.'
      },
      {
        title: 'Atomic Booking',
        tag: 'Race Condition Safe',
        desc: 'Database row locks and Cal.com slot reservations prevent double booking.'
      },
      {
        title: 'Model Failover',
        tag: 'Exponential Retries',
        desc: 'Automated fallback to secondary models if primary API encounters rate limits.'
      },
      {
        title: 'Injection Defense',
        tag: 'Prompt Isolation',
        desc: 'System instructions isolated from user chat text to resist prompt injection.'
      }
    ];

    securityItems.forEach((item, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const cX = 0.6 + (col * 2.25);
      const cY = 1.55 + (row * 1.65);

      slide.addShape('roundRect', {
        x: cX,
        y: cY,
        w: 2.15,
        h: 1.5,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addText(item.title, {
        x: cX + 0.12,
        y: cY + 0.1,
        w: 1.9,
        h: 0.25,
        fontSize: 11,
        fontFace: FONT_PRIMARY,
        color: TEXT_WHITE,
        bold: true,
        margin: 0
      });

      slide.addShape('roundRect', {
        x: cX + 0.12,
        y: cY + 0.38,
        w: 1.9,
        h: 0.25,
        rectRadius: 0.04,
        fill: { color: '0D2433' }
      });
      slide.addText(item.tag, {
        x: cX + 0.12,
        y: cY + 0.38,
        w: 1.9,
        h: 0.25,
        fontSize: 8.5,
        fontFace: FONT_PRIMARY,
        color: TEAL_ACCENT,
        bold: true,
        align: 'center',
        valign: 'middle',
        margin: 0
      });

      slide.addText(item.desc, {
        x: cX + 0.12,
        y: cY + 0.68,
        w: 1.9,
        h: 0.75,
        fontSize: 8.5,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        lineSpacing: 12,
        margin: 0
      });
    });

    slide.addNotes(
      "Reliability and defensive engineering were core requirements. Every webhook is verified using HMAC-SHA256 signatures, ensuring only Meta can trigger our endpoints. Our asynchronous queue acknowledges requests under two hundred milliseconds so Meta never retries unnecessarily. A three-second debounce window buffers rapid consecutive messages into a single prompt. We also enforced database row-level security, exponential API retries, prompt injection protections, and a persistent email outbox to guarantee delivery even during network failures."
    );
  }

  // ==========================================
  // SLIDE 13: TECH STACK & TESTING
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 13 of 15');
    addSlideHeader(slide, 'Technology Stack & Rigorous Testing', 'Production-grade TypeScript tooling backed by 61 automated tests and live end-to-end trials.', 'STACK & VALIDATION');

    const stackItems = [
      { name: 'TypeScript', role: 'Type Safety' },
      { name: 'Fastify', role: 'Web Server' },
      { name: 'Supabase', role: 'PostgreSQL & RLS' },
      { name: 'Gemini 2.5', role: 'AI Model & Vision' },
      { name: 'WhatsApp API', role: 'Meta Cloud API' },
      { name: 'Cal.com', role: 'Scheduling V2' },
      { name: 'Nodemailer', role: 'SMTP Alerts' }
    ];

    stackItems.forEach((st, idx) => {
      const sX = 0.6 + (idx * 1.28);
      slide.addShape('roundRect', {
        x: sX,
        y: 1.55,
        w: 1.2,
        h: 0.72,
        rectRadius: 0.06,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });
      slide.addText([
        { text: st.name + '\n', options: { fontSize: 10, bold: true, color: GREEN_ACCENT } },
        { text: st.role, options: { fontSize: 8, color: TEXT_MUTED } }
      ], {
        x: sX,
        y: 1.63,
        w: 1.2,
        h: 0.55,
        fontFace: FONT_PRIMARY,
        align: 'center',
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 0.6,
      y: 2.38,
      w: 8.8,
      h: 0.55,
      rectRadius: 0.06,
      fill: { color: '0D241C' },
      line: { color: GREEN_ACCENT, width: 1 }
    });
    slide.addText([
      { text: 'TEST VERIFICATION: ', options: { bold: true, color: GREEN_ACCENT, fontSize: 11 } },
      { text: '61 Automated Unit & Integration Tests across 12 suites (Vitest). Mocks external APIs to test signature checks, queue debouncing, budget regex, tool routing, and failure recovery. Zero regressions.', options: { color: TEXT_WHITE, fontSize: 10 } }
    ], {
      x: 0.8,
      y: 2.42,
      w: 8.4,
      h: 0.45,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    // Left: Terminal screenshot image
    slide.addImage({
      path: path.resolve('docs/screenshots/vitest_test_results.png'),
      x: 0.6,
      y: 3.05,
      w: 4.8,
      h: 1.95
    });

    // Right: End-to-End Live Validation Card
    slide.addShape('roundRect', {
      x: 5.6,
      y: 3.05,
      w: 3.8,
      h: 1.95,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('End-to-End Live Validation', {
      x: 5.85,
      y: 3.2,
      w: 3.3,
      h: 0.28,
      fontSize: 12,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      margin: 0
    });

    const testBullets = [
      { bold: 'Live Meta Webhook: ', text: 'Verified with real WhatsApp test devices over HTTPS tunnel.' },
      { bold: 'Cal.com V2 Booking: ', text: 'Live calendar slot reservations verified in Cal.com dashboard.' },
      { bold: 'SMTP Outbox: ', text: 'Email delivery confirmed to business owner destination inbox.' },
      { bold: 'Deterministic Mocking: ', text: 'Vitest mocks isolate network latency for deterministic CI runs.' }
    ];

    testBullets.forEach((tb, idx) => {
      const tbY = 3.52 + (idx * 0.35);
      slide.addText([
        { text: tb.bold, options: { bold: true, color: TEXT_WHITE } },
        { text: tb.text, options: { color: TEXT_SUB } }
      ], {
        x: 5.85,
        y: tbY,
        w: 3.3,
        h: 0.32,
        fontSize: 8.5,
        fontFace: FONT_PRIMARY,
        bullet: true,
        margin: 0
      });
    });

    slide.addNotes(
      "Our technology stack pairs Node.js and TypeScript on Fastify with Supabase PostgreSQL, Gemini Flash, Cal.com, and Meta's WhatsApp Cloud API. Quality assurance was verified through two rigorous testing layers. First, sixty-one automated unit and integration tests across twelve suites test all core logic, including budget parsing and message queuing, using mocked external APIs, as shown in the terminal test output. Second, we conducted comprehensive manual end-to-end tests using real WhatsApp devices and Cal.com bookings."
    );
  }

  // ==========================================
  // SLIDE 14: LIMITATIONS & FUTURE WORK
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 14 of 15');
    addSlideHeader(slide, 'Current Limitations & Future Engineering Roadmap', 'Honest assessment of prototype boundaries and clear roadmap for production scalability.', 'LIMITATIONS & ROADMAP');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 4.3,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Current Prototype Boundaries', {
      x: 0.85,
      y: 1.7,
      w: 3.8,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT_PRIMARY,
      color: AMBER_ACCENT,
      bold: true,
      margin: 0
    });

    const limitations = [
      { bold: 'Local Host & Tunnel: ', text: 'Runs locally on a laptop via temporary Cloudflare tunnel.' },
      { bold: 'Free-Tier AI Quotas: ', text: 'Free-tier Gemini quotas limit peak concurrent messages.' },
      { bold: 'No Human Inbox UI: ', text: 'No live graphical chat dashboard for sales staff to intervene.' },
      { bold: 'Single-Instance Queue: ', text: 'In-memory debounce queue runs on a single Node process.' },
      { bold: 'Seeded Demo Inventory: ', text: 'Uses seeded demo plots and villas in Supabase.' }
    ];

    limitations.forEach((item, idx) => {
      const lY = 2.1 + (idx * 0.52);
      slide.addText([
        { text: item.bold, options: { bold: true, color: TEXT_WHITE } },
        { text: item.text, options: { color: TEXT_SUB } }
      ], {
        x: 0.85,
        y: lY,
        w: 3.8,
        h: 0.48,
        fontSize: 10,
        fontFace: FONT_PRIMARY,
        bullet: true,
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 5.1,
      y: 1.55,
      w: 4.3,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Future Engineering Roadmap', {
      x: 5.35,
      y: 1.7,
      w: 3.8,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT_PRIMARY,
      color: TEAL_ACCENT,
      bold: true,
      margin: 0
    });

    const roadmap = [
      { bold: 'Cloud Container Hosting: ', text: 'Deploy to AWS / GCP via Docker with managed Redis.' },
      { bold: 'Human Agent Dashboard: ', text: 'Build a Next.js web portal allowing live chat takeovers.' },
      { bold: 'Enterprise CRM Connectors: ', text: 'Sync deals with Salesforce, HubSpot, or Zoho in real time.' },
      { bold: 'Multi-Tenant Support: ', text: 'Partition credentials to host multiple real estate agencies.' },
      { bold: 'Privacy & Retention Rules: ', text: 'Automated data deletion compliant with DPDP regulations.' }
    ];

    roadmap.forEach((item, idx) => {
      const rY = 2.1 + (idx * 0.52);
      slide.addText([
        { text: item.bold, options: { bold: true, color: TEXT_WHITE } },
        { text: item.text, options: { color: TEXT_SUB } }
      ], {
        x: 5.35,
        y: rY,
        w: 3.8,
        h: 0.48,
        fontSize: 10,
        fontFace: FONT_PRIMARY,
        bullet: true,
        margin: 0
      });
    });

    slide.addNotes(
      "As an honest engineering submission, we clearly acknowledge this is a working prototype. Currently, it runs on a local development laptop using a temporary Cloudflare tunnel, operates under free-tier AI rate limits, and uses demo real estate data without a visual human chat inbox. In our future work roadmap, we plan to containerize the server for cloud hosting, build a live human-agent handover dashboard, add enterprise CRM integrations, and implement multi-tenant support for multiple businesses."
    );
  }

  // ==========================================
  // SLIDE 15: CONCLUSION & THANK YOU
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Slide 15 of 15');
    addSlideHeader(slide, 'Conclusion & Submission Summary', 'Practical AI automation delivering concrete operational value to local businesses.', 'PROJECT WRAP-UP');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 5.2,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Key Takeaways & Engineering Learnings', {
      x: 0.85,
      y: 1.72,
      w: 4.7,
      h: 0.3,
      fontSize: 13,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      margin: 0
    });

    const takeaways = [
      {
        title: '1. Solves a Real Business Pain Point',
        desc: 'Transforms noisy, delayed WhatsApp advertising inquiries into instant, structured lead scoring and verified in-person site visits.'
      },
      {
        title: '2. Grounded AI without Hallucinations',
        desc: 'Proves that function calling with strict schema definitions and localized database lookups prevents hallucinated pricing and amenities.'
      },
      {
        title: '3. Resilient Engineering Architecture',
        desc: 'Demonstrates defensive asynchronous patterns: cryptographic HMAC validation, queue debouncing, atomic slot reservations, and automated tests.'
      }
    ];

    takeaways.forEach((t, idx) => {
      const tY = 2.12 + (idx * 0.82);
      slide.addText([
        { text: t.title + '\n', options: { fontSize: 11, bold: true, color: TEXT_WHITE } },
        { text: t.desc, options: { fontSize: 9.5, color: TEXT_SUB } }
      ], {
        x: 0.85,
        y: tY,
        w: 4.7,
        h: 0.75,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    // Right Column: Links & QR Image
    slide.addShape('roundRect', {
      x: 6.0,
      y: 1.55,
      w: 3.4,
      h: 3.35,
      rectRadius: 0.1,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });

    slide.addText('Project Repository & Demo', {
      x: 6.2,
      y: 1.72,
      w: 3.0,
      h: 0.3,
      fontSize: 12,
      fontFace: FONT_PRIMARY,
      color: TEAL_ACCENT,
      bold: true,
      margin: 0
    });

    // Embed Real Scannable QR code
    slide.addImage({
      path: path.resolve('docs/screenshots/github_qr.png'),
      x: 6.9,
      y: 2.1,
      w: 1.6,
      h: 1.6
    });

    slide.addText([
      { text: 'PROJECT AUTHORS:\n', options: { fontSize: 8, bold: true, color: GREEN_ACCENT } },
      { text: 'Gunda Ganesh • Guddati Rosi • Grandhi Karthik\n', options: { fontSize: 8.5, color: TEXT_WHITE, bold: true } },
      { text: 'Sathyabama Institute of Science and Technology (B.E. CSE)\n\n', options: { fontSize: 8, color: TEXT_MUTED } },
      { text: 'GitHub Repository (2025–2026):\n', options: { fontSize: 8, bold: true, color: TEXT_MUTED } },
      { text: 'https://github.com/bunnyrams69/AI_Automation_Agent', options: { fontSize: 8, color: TEAL_ACCENT } }
    ], {
      x: 6.2,
      y: 3.75,
      w: 3.0,
      h: 1.1,
      fontFace: FONT_PRIMARY,
      margin: 0
    });

    slide.addNotes(
      "In conclusion, this project demonstrates how combining generative AI with disciplined software engineering solves a genuine operational headache for local businesses. By coupling Gemini function calling with robust queuing, signature verification, and Cal.com scheduling, we turn chaotic WhatsApp chats into confirmed customer visits. The full TypeScript source code, migration scripts, and test suites are available on GitHub via the QR code on the screen. Thank you very much for your time, and I welcome any questions."
    );
  }

  // ==========================================
  // APPENDIX A: DATABASE OVERVIEW DIAGRAM
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Appendix A');
    addSlideHeader(slide, 'Appendix A: Relational Database Schema Overview', '10 interconnected PostgreSQL tables managed in Supabase with foreign key integrity and RLS.', 'APPENDIX A');

    slide.addShape('roundRect', {
      x: 0.6,
      y: 1.55,
      w: 2.8,
      h: 3.35,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });
    slide.addText('1. Core Leads & Messaging', {
      x: 0.8,
      y: 1.7,
      w: 2.4,
      h: 0.25,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      bold: true,
      margin: 0
    });

    const leadTables = [
      { name: 'leads', fields: 'id, phone, name, status, qualification_score, budget_min, budget_max, timeline' },
      { name: 'conversations', fields: 'id, lead_id (FK), channel, status, last_message_at, metadata' },
      { name: 'messages', fields: 'id, conversation_id (FK), direction (in/out), content, tool_calls, created_at' },
      { name: 'inbound_events', fields: 'id, event_id, payload, status, attempts, last_error, locked_at' }
    ];

    leadTables.forEach((t, idx) => {
      const tY = 2.05 + (idx * 0.68);
      slide.addShape('roundRect', {
        x: 0.75,
        y: tY,
        w: 2.5,
        h: 0.58,
        rectRadius: 0.04,
        fill: { color: '142236' }
      });
      slide.addText([
        { text: t.name + '\n', options: { fontSize: 9.5, bold: true, color: TEXT_WHITE } },
        { text: t.fields, options: { fontSize: 7.5, color: TEXT_MUTED } }
      ], {
        x: 0.85,
        y: tY + 0.05,
        w: 2.3,
        h: 0.48,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    slide.addShape('roundRect', {
      x: 3.6,
      y: 1.55,
      w: 2.8,
      h: 3.35,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });
    slide.addText('2. Business Knowledge Base', {
      x: 3.8,
      y: 1.7,
      w: 2.4,
      h: 0.25,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: TEAL_ACCENT,
      bold: true,
      margin: 0
    });

    const catalogTables = [
      { name: 'sites', fields: 'id, name, location, price_min, price_max, plot_sizes_sqft, amenities, status' },
      { name: 'knowledge_base', fields: 'id, category, question, answer, tags, embedding, is_active' }
    ];

    catalogTables.forEach((t, idx) => {
      const tY = 2.05 + (idx * 0.95);
      slide.addShape('roundRect', {
        x: 3.75,
        y: tY,
        w: 2.5,
        h: 0.85,
        rectRadius: 0.04,
        fill: { color: '142236' }
      });
      slide.addText([
        { text: t.name + '\n', options: { fontSize: 10, bold: true, color: TEXT_WHITE } },
        { text: t.fields, options: { fontSize: 8, color: TEXT_MUTED } }
      ], {
        x: 3.85,
        y: tY + 0.08,
        w: 2.3,
        h: 0.7,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    slide.addText('Foreign Key Relations:\n• conversations.lead_id -> leads.id\n• messages.conversation_id -> conversations.id\n• site_visits.lead_id -> leads.id\n• site_visits.site_id -> sites.id', {
      x: 3.8,
      y: 4.05,
      w: 2.4,
      h: 0.75,
      fontSize: 8,
      fontFace: FONT_PRIMARY,
      color: GREEN_ACCENT,
      margin: 0
    });

    slide.addShape('roundRect', {
      x: 6.6,
      y: 1.55,
      w: 2.8,
      h: 3.35,
      rectRadius: 0.08,
      fill: { color: CARD_BG },
      line: { color: CARD_BORDER, width: 1 }
    });
    slide.addText('3. Operations & Auditing', {
      x: 6.8,
      y: 1.7,
      w: 2.4,
      h: 0.25,
      fontSize: 11,
      fontFace: FONT_PRIMARY,
      color: AMBER_ACCENT,
      bold: true,
      margin: 0
    });

    const opTables = [
      { name: 'site_visits', fields: 'id, lead_id (FK), site_id (FK), cal_booking_id, scheduled_at, status' },
      { name: 'follow_ups', fields: 'id, lead_id (FK), scheduled_for, template_name, status, sent_at' },
      { name: 'email_outbox', fields: 'id, recipient, subject, body, status, attempts, sent_at' },
      { name: 'audit_log', fields: 'id, event_type, entity_id, actor, payload, created_at' }
    ];

    opTables.forEach((t, idx) => {
      const tY = 2.05 + (idx * 0.68);
      slide.addShape('roundRect', {
        x: 6.75,
        y: tY,
        w: 2.5,
        h: 0.58,
        rectRadius: 0.04,
        fill: { color: '142236' }
      });
      slide.addText([
        { text: t.name + '\n', options: { fontSize: 9.5, bold: true, color: TEXT_WHITE } },
        { text: t.fields, options: { fontSize: 7.5, color: TEXT_MUTED } }
      ], {
        x: 6.85,
        y: tY + 0.05,
        w: 2.3,
        h: 0.48,
        fontFace: FONT_PRIMARY,
        margin: 0
      });
    });

    slide.addNotes(
      "Appendix A illustrates our relational database schema implemented in Supabase PostgreSQL across ten tables. At the center is the leads table, which connects directly to conversations and messages. Inbound events handle queue idempotency and retry locking. The sites and knowledge base tables hold our property catalog and answering context. Operational tables including site visits, follow-ups, email outbox, and audit logs ensure complete traceability and atomic execution across every customer interaction."
    );
  }

  // ==========================================
  // APPENDIX B: ENVIRONMENT VARIABLES
  // ==========================================
  {
    const slide = pres.addSlide();
    applyBaseLayout(slide, 'Appendix B');
    addSlideHeader(slide, 'Appendix B: Service Configuration Variables', 'Environment variables grouped by service boundary. All secrets sanitized for public submission.', 'APPENDIX B');

    const envGroups = [
      {
        title: '1. Server & Networking',
        color: GREEN_ACCENT,
        vars: [
          { name: 'PORT', desc: 'Port number for Fastify server (default: 3000)' },
          { name: 'NODE_ENV', desc: 'Environment mode (development / production)' },
          { name: 'APP_BASE_URL', desc: 'Public tunnel URL for Meta webhooks' },
          { name: 'WEBHOOK_VERIFY_TOKEN', desc: 'Shared secret for Meta webhook challenge' }
        ]
      },
      {
        title: '2. Meta WhatsApp Cloud API',
        color: TEAL_ACCENT,
        vars: [
          { name: 'WHATSAPP_PHONE_NUMBER_ID', desc: 'Meta Graph API Sender Phone ID' },
          { name: 'WHATSAPP_BUSINESS_ACCOUNT_ID', desc: 'Meta Business Manager Account ID' },
          { name: 'WHATSAPP_ACCESS_TOKEN', desc: 'Meta System User permanent API token' },
          { name: 'META_APP_SECRET', desc: 'Secret for HMAC-SHA256 signature verification' }
        ]
      },
      {
        title: '3. Supabase Database & Security',
        color: '60A5FA',
        vars: [
          { name: 'SUPABASE_URL', desc: 'Hosted PostgreSQL endpoint URI' },
          { name: 'SUPABASE_ANON_KEY', desc: 'Public client key with RLS enforcement' },
          { name: 'SUPABASE_SERVICE_ROLE_KEY', desc: 'Privileged backend key for worker execution' }
        ]
      },
      {
        title: '4. AI Engine & Calendar / SMTP',
        color: AMBER_ACCENT,
        vars: [
          { name: 'GEMINI_API_KEY', desc: 'Google AI Studio Gemini API key' },
          { name: 'CALCOM_API_KEY', desc: 'Cal.com V2 booking API credential' },
          { name: 'CALCOM_EVENT_TYPE_ID', desc: 'Site-visit calendar event type identifier' },
          { name: 'OWNER_NOTIFICATION_EMAIL', desc: 'Destination inbox for hot-lead alerts' }
        ]
      }
    ];

    envGroups.forEach((eg, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const eX = 0.6 + (col * 4.5);
      const eY = 1.55 + (row * 1.65);

      slide.addShape('roundRect', {
        x: eX,
        y: eY,
        w: 4.3,
        h: 1.5,
        rectRadius: 0.08,
        fill: { color: CARD_BG },
        line: { color: CARD_BORDER, width: 1 }
      });

      slide.addText(eg.title, {
        x: eX + 0.15,
        y: eY + 0.1,
        w: 4.0,
        h: 0.25,
        fontSize: 11,
        fontFace: FONT_PRIMARY,
        color: eg.color,
        bold: true,
        margin: 0
      });

      const varLines = eg.vars.map(v => `${v.name}: ${v.desc}`).join('\n');
      slide.addText(varLines, {
        x: eX + 0.15,
        y: eY + 0.38,
        w: 4.0,
        h: 1.0,
        fontSize: 8.5,
        fontFace: FONT_PRIMARY,
        color: TEXT_SUB,
        lineSpacing: 13,
        margin: 0
      });
    });

    slide.addNotes(
      "Appendix B details the configuration variables required across each external service boundary, strictly omitting secret values. The server requires port and webhook verification tokens. Meta WhatsApp requires phone number IDs and HMAC app secrets. Gemini requires an API key and model identifier. Supabase requires service role keys for backend queries, while Cal.com and SMTP require scheduling and email credentials. All sensitive tokens are managed via environment variables and excluded from Git."
    );
  }

  // Ensure docs directory exists
  const docsDir = path.join(__dirname, '..', 'docs');
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }

  const primaryPath = path.join(docsDir, 'WhatsApp_AI_Agent_Explainer.pptx');
  const alternatePath = path.join(docsDir, 'WhatsApp_AI_Agent_Explainer_Updated.pptx');
  
  let targetPath = primaryPath;
  try {
    await pres.writeFile({ fileName: primaryPath });
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.log('Primary file is currently open in PowerPoint. Writing to alternate updated file...');
      targetPath = alternatePath;
      await pres.writeFile({ fileName: alternatePath });
    } else {
      throw err;
    }
  }

  // Also copy to artifacts directory
  const artifactDir = 'C:\\Users\\WELCOME\\.gemini\\antigravity-ide\\brain\\54c1c7eb-a061-4d38-a965-35da747c2082';
  try {
    fs.copyFileSync(targetPath, path.join(artifactDir, 'WhatsApp_AI_Agent_Explainer.pptx'));
  } catch (e) {
    // Artifact copy fallback
  }

  console.log(`Presentation successfully created at: ${targetPath}`);
}

createDeck().catch(err => {
  console.error('Error generating presentation:', err);
  process.exit(1);
});
