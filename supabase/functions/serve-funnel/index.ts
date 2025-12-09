import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FunnelStep {
  id: string;
  order_index: number;
  step_type: string;
  content: Record<string, any>;
}

interface FunnelSettings {
  logo_url?: string;
  primary_color: string;
  background_color: string;
  button_text: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain } = await req.json();
    
    if (!domain) {
      return new Response(
        JSON.stringify({ error: 'Domain is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean domain (remove www. if present)
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');

    console.log(`Serving funnel for domain: ${cleanDomain}`);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Look up the domain in funnel_domains
    const { data: domainRecord, error: domainError } = await supabase
      .from('funnel_domains')
      .select('id, domain, status, ssl_provisioned, team_id')
      .eq('domain', cleanDomain)
      .eq('status', 'verified')
      .single();

    if (domainError || !domainRecord) {
      console.log(`Domain not found or not verified: ${cleanDomain}`);
      return new Response(
        generateErrorPage('Domain Not Found', 'This domain is not configured or not verified.'),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Find the funnel linked to this domain
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, name, slug, status, settings, team_id')
      .eq('domain_id', domainRecord.id)
      .eq('status', 'published')
      .single();

    if (funnelError || !funnel) {
      console.log(`No published funnel found for domain: ${cleanDomain}`);
      return new Response(
        generateErrorPage('No Funnel', 'No funnel is linked to this domain.'),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    // Get funnel steps
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', funnel.id)
      .order('order_index', { ascending: true });

    if (stepsError || !steps || steps.length === 0) {
      console.log(`No steps found for funnel: ${funnel.slug}`);
      return new Response(
        generateErrorPage('Empty Funnel', 'This funnel has no content.'),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
      );
    }

    const settings = funnel.settings as FunnelSettings;
    const html = generateFunnelHTML(funnel, steps, settings, cleanDomain);

    console.log(`Serving funnel ${funnel.slug} for domain ${cleanDomain}`);

    return new Response(html, {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
      }
    });

  } catch (error: unknown) {
    console.error('Serve funnel error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      generateErrorPage('Error', errorMessage),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
    );
  }
});

function generateErrorPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      color: white;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    .container { text-align: center; padding: 2rem; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { color: #888; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

function generateFunnelHTML(
  funnel: { id: string; slug: string; name: string; team_id: string },
  steps: FunnelStep[],
  settings: FunnelSettings,
  domain: string
): string {
  // Encode data for embedding in the page
  const funnelData = JSON.stringify({
    id: funnel.id,
    slug: funnel.slug,
    name: funnel.name,
    team_id: funnel.team_id,
    settings,
  });
  const stepsData = JSON.stringify(steps);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="theme-color" content="${settings.background_color || '#0a0a0a'}">
  <title>${funnel.name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      min-height: 100vh;
      background: ${settings.background_color || '#0a0a0a'};
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overflow-x: hidden;
    }
    
    #funnel-root {
      min-height: 100vh;
      width: 100%;
    }
    
    /* Loading state */
    .loading-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .spinner {
      width: 32px;
      height: 32px;
      border: 2px solid rgba(255,255,255,0.2);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    /* Step container */
    .step-container {
      min-height: 100vh;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 4rem 1rem 2rem;
    }
    
    .step-content {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
    
    /* Logo */
    .logo {
      position: fixed;
      top: 1rem;
      left: 1rem;
      z-index: 100;
    }
    
    .logo img {
      height: 24px;
      width: auto;
      object-fit: contain;
    }
    
    @media (min-width: 768px) {
      .logo { top: 1.5rem; left: 1.5rem; }
      .logo img { height: 32px; }
      .step-container { padding: 5rem 1.5rem 2rem; }
    }
    
    /* Progress dots */
    .progress-dots {
      position: fixed;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 6px;
      z-index: 100;
    }
    
    @media (min-width: 768px) {
      .progress-dots { top: 1.5rem; right: 1.5rem; }
    }
    
    .progress-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: rgba(255,255,255,0.2);
      transition: all 0.3s ease;
    }
    
    .progress-dot.active {
      background: ${settings.primary_color || '#22c55e'};
      box-shadow: 0 0 8px ${settings.primary_color || '#22c55e'}60;
    }
    
    .progress-dot.completed {
      background: ${settings.primary_color || '#22c55e'};
    }
    
    /* Typography */
    .headline {
      color: white;
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 1rem;
      text-align: center;
    }
    
    @media (min-width: 768px) {
      .headline { font-size: 2.5rem; }
    }
    
    .subheadline {
      color: rgba(255,255,255,0.7);
      font-size: 1rem;
      line-height: 1.5;
      text-align: center;
      margin-bottom: 2rem;
    }
    
    /* Buttons */
    .primary-button {
      width: 100%;
      padding: 1rem 2rem;
      background: ${settings.primary_color || '#22c55e'};
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1.125rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .primary-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px ${settings.primary_color || '#22c55e'}40;
    }
    
    /* Input fields */
    .input-field {
      width: 100%;
      padding: 1rem;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      margin-bottom: 1rem;
      outline: none;
      transition: all 0.2s ease;
    }
    
    .input-field:focus {
      border-color: ${settings.primary_color || '#22c55e'};
      box-shadow: 0 0 0 3px ${settings.primary_color || '#22c55e'}20;
    }
    
    .input-field::placeholder {
      color: rgba(255,255,255,0.5);
    }
    
    /* Option cards */
    .option-card {
      width: 100%;
      padding: 1rem 1.25rem;
      background: rgba(255,255,255,0.05);
      border: 2px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .option-card:hover {
      border-color: rgba(255,255,255,0.3);
      background: rgba(255,255,255,0.08);
    }
    
    .option-card.selected {
      border-color: ${settings.primary_color || '#22c55e'};
      background: ${settings.primary_color || '#22c55e'}15;
    }
    
    .option-icon {
      font-size: 1.5rem;
    }
    
    .option-label {
      color: white;
      font-size: 1rem;
      font-weight: 500;
      flex: 1;
    }
    
    .option-radio {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .option-card.selected .option-radio {
      border-color: ${settings.primary_color || '#22c55e'};
    }
    
    .option-radio-inner {
      width: 10px;
      height: 10px;
      background: ${settings.primary_color || '#22c55e'};
      border-radius: 50%;
      opacity: 0;
      transition: opacity 0.2s ease;
    }
    
    .option-card.selected .option-radio-inner {
      opacity: 1;
    }
    
    /* Video embed */
    .video-container {
      width: 100%;
      aspect-ratio: 16/9;
      border-radius: 12px;
      overflow: hidden;
      background: rgba(0,0,0,0.5);
      margin-bottom: 1.5rem;
    }
    
    .video-container iframe {
      width: 100%;
      height: 100%;
      border: none;
    }
    
    /* Embed container */
    .embed-container {
      width: 100%;
      min-height: 500px;
      border-radius: 12px;
      overflow: hidden;
      background: white;
    }
    
    .embed-container iframe {
      width: 100%;
      height: 100%;
      border: none;
      min-height: 500px;
    }
    
    /* Question counter */
    .question-counter {
      color: rgba(255,255,255,0.5);
      font-size: 0.875rem;
      text-align: center;
      margin-bottom: 1.5rem;
    }
    
    /* Hidden steps */
    .step-hidden {
      display: none;
    }
    
    /* Transitions */
    .fade-in {
      animation: fadeIn 0.3s ease forwards;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  </style>
</head>
<body>
  <div id="funnel-root">
    <div class="loading-container">
      <div class="spinner"></div>
    </div>
  </div>
  
  <script>
    // Funnel data embedded from server
    const FUNNEL_DATA = ${funnelData};
    const STEPS_DATA = ${stepsData};
    const SUPABASE_URL = '${Deno.env.get('SUPABASE_URL')}';
    const SUPABASE_ANON_KEY = '${Deno.env.get('SUPABASE_ANON_KEY')}';
    
    // State
    let currentStepIndex = 0;
    let answers = {};
    let leadId = null;
    let calendlyBookingData = null;
    
    // Initialize funnel
    document.addEventListener('DOMContentLoaded', () => {
      renderFunnel();
      setupCalendlyListener();
    });
    
    function setupCalendlyListener() {
      window.addEventListener('message', (event) => {
        if (event.data.event === 'calendly.event_scheduled') {
          console.log('Calendly booking detected:', event.data);
          calendlyBookingData = {
            event_time: event.data.payload?.event?.start_time,
            event_type: event.data.payload?.event_type?.name,
            invitee_uri: event.data.payload?.invitee?.uri,
            scheduling_url: event.data.payload?.event?.scheduling_url,
          };
          // Auto-advance after Calendly booking
          setTimeout(() => handleNext(), 1500);
        }
      });
    }
    
    function renderFunnel() {
      const root = document.getElementById('funnel-root');
      const settings = FUNNEL_DATA.settings;
      
      // Build HTML
      let html = '';
      
      // Logo
      if (settings.logo_url) {
        html += '<div class="logo"><img src="' + settings.logo_url + '" alt="Logo"></div>';
      }
      
      // Progress dots
      html += '<div class="progress-dots">';
      STEPS_DATA.forEach((_, i) => {
        const isActive = i === currentStepIndex;
        const isCompleted = i < currentStepIndex;
        html += '<div class="progress-dot' + (isActive ? ' active' : '') + (isCompleted ? ' completed' : '') + '"></div>';
      });
      html += '</div>';
      
      // Steps
      STEPS_DATA.forEach((step, i) => {
        const isVisible = i === currentStepIndex;
        html += '<div class="step-container' + (isVisible ? ' fade-in' : ' step-hidden') + '" data-step-index="' + i + '">';
        html += '<div class="step-content">';
        html += renderStep(step, i);
        html += '</div>';
        html += '</div>';
      });
      
      root.innerHTML = html;
    }
    
    function renderStep(step, index) {
      const content = step.content || {};
      const settings = FUNNEL_DATA.settings;
      
      // Count question steps
      const questionTypes = ['text_question', 'multi_choice', 'email_capture', 'phone_capture', 'opt_in'];
      const questionSteps = STEPS_DATA.filter(s => questionTypes.includes(s.step_type));
      const questionIndex = questionSteps.findIndex(s => s.id === step.id);
      const questionNumber = questionIndex >= 0 ? questionIndex + 1 : null;
      const totalQuestions = questionSteps.length;
      
      let html = '';
      
      switch (step.step_type) {
        case 'welcome':
          html += renderHeadline(content.headline);
          html += renderSubheadline(content.subheadline);
          html += '<button class="primary-button" onclick="handleNext()">' + (content.buttonText || settings.button_text || 'Get Started') + '</button>';
          break;
          
        case 'text_question':
          if (questionNumber) {
            html += '<div class="question-counter">Question ' + questionNumber + ' of ' + totalQuestions + '</div>';
          }
          html += renderHeadline(content.question || content.headline);
          html += '<input type="text" class="input-field" id="text-input-' + index + '" placeholder="' + (content.placeholder || 'Type your answer...') + '">';
          html += '<button class="primary-button" onclick="handleTextSubmit(' + index + ')">' + (content.buttonText || 'Continue') + '</button>';
          break;
          
        case 'multi_choice':
          if (questionNumber) {
            html += '<div class="question-counter">Question ' + questionNumber + ' of ' + totalQuestions + '</div>';
          }
          html += renderHeadline(content.question || content.headline);
          const options = content.options || [];
          options.forEach((opt, i) => {
            const label = typeof opt === 'string' ? opt : (opt.label || opt.text || '');
            const icon = typeof opt === 'object' ? (opt.icon || '') : '';
            html += '<div class="option-card" data-option-index="' + i + '" onclick="handleOptionSelect(this, ' + index + ', \\'' + label.replace(/'/g, "\\'") + '\\')">';
            if (icon) html += '<span class="option-icon">' + icon + '</span>';
            html += '<span class="option-label">' + label + '</span>';
            html += '<div class="option-radio"><div class="option-radio-inner"></div></div>';
            html += '</div>';
          });
          html += '<button class="primary-button" id="multi-next-' + index + '" style="opacity:0.5;pointer-events:none" onclick="handleNext()">' + (content.buttonText || 'Next Question') + '</button>';
          break;
          
        case 'email_capture':
          if (questionNumber) {
            html += '<div class="question-counter">Question ' + questionNumber + ' of ' + totalQuestions + '</div>';
          }
          html += renderHeadline(content.headline || 'What\\'s your email?');
          html += '<input type="email" class="input-field" id="email-input-' + index + '" placeholder="' + (content.placeholder || 'Enter your email...') + '">';
          html += '<button class="primary-button" onclick="handleEmailSubmit(' + index + ')">' + (content.buttonText || 'Continue') + '</button>';
          break;
          
        case 'phone_capture':
          if (questionNumber) {
            html += '<div class="question-counter">Question ' + questionNumber + ' of ' + totalQuestions + '</div>';
          }
          html += renderHeadline(content.headline || 'What\\'s your phone number?');
          html += '<input type="tel" class="input-field" id="phone-input-' + index + '" placeholder="' + (content.placeholder || 'Enter your phone number...') + '">';
          html += '<button class="primary-button" onclick="handlePhoneSubmit(' + index + ')">' + (content.buttonText || 'Continue') + '</button>';
          break;
          
        case 'opt_in':
          if (questionNumber) {
            html += '<div class="question-counter">Question ' + questionNumber + ' of ' + totalQuestions + '</div>';
          }
          html += renderHeadline(content.headline || 'Enter your details');
          html += '<input type="text" class="input-field" id="name-input-' + index + '" placeholder="Your name">';
          html += '<input type="email" class="input-field" id="optin-email-' + index + '" placeholder="Your email">';
          html += '<input type="tel" class="input-field" id="optin-phone-' + index + '" placeholder="Your phone">';
          html += '<button class="primary-button" onclick="handleOptInSubmit(' + index + ')">' + (content.buttonText || 'Submit') + '</button>';
          break;
          
        case 'video':
          html += renderHeadline(content.headline);
          if (content.videoUrl) {
            html += '<div class="video-container">';
            html += '<iframe src="' + getEmbedUrl(content.videoUrl) + '" allowfullscreen></iframe>';
            html += '</div>';
          }
          html += '<button class="primary-button" onclick="handleNext()">' + (content.buttonText || 'Continue') + '</button>';
          break;
          
        case 'embed':
          html += renderHeadline(content.headline);
          if (content.embedUrl) {
            const scale = content.scale || 0.75;
            html += '<div class="embed-container" style="transform:scale(' + scale + ');transform-origin:top center;width:' + (100/scale) + '%">';
            html += '<iframe src="' + content.embedUrl + '" allowfullscreen></iframe>';
            html += '</div>';
          }
          break;
          
        case 'thank_you':
          html += renderHeadline(content.headline || 'Thank you!');
          html += renderSubheadline(content.subheadline || content.message || 'We\\'ll be in touch soon.');
          break;
          
        default:
          html += renderHeadline(content.headline || '');
          if (content.buttonText) {
            html += '<button class="primary-button" onclick="handleNext()">' + content.buttonText + '</button>';
          }
      }
      
      return html;
    }
    
    function renderHeadline(text) {
      if (!text) return '';
      // Support HTML content
      return '<h1 class="headline">' + text + '</h1>';
    }
    
    function renderSubheadline(text) {
      if (!text) return '';
      return '<p class="subheadline">' + text + '</p>';
    }
    
    function getEmbedUrl(url) {
      if (!url) return '';
      // YouTube
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        const videoId = url.match(/(?:youtu\\.be\\/|youtube\\.com(?:\\/embed\\/|\\/v\\/|\\/watch\\?v=))([\\w-]{11})/);
        if (videoId) return 'https://www.youtube.com/embed/' + videoId[1];
      }
      // Vimeo
      if (url.includes('vimeo.com')) {
        const videoId = url.match(/vimeo\\.com\\/(?:video\\/)?(\\d+)/);
        if (videoId) return 'https://player.vimeo.com/video/' + videoId[1];
      }
      // Loom
      if (url.includes('loom.com')) {
        const videoId = url.match(/loom\\.com\\/share\\/([\\w-]+)/);
        if (videoId) return 'https://www.loom.com/embed/' + videoId[1];
      }
      return url;
    }
    
    function handleNext(value) {
      const currentStep = STEPS_DATA[currentStepIndex];
      
      if (value !== undefined) {
        answers[currentStep.id] = {
          value,
          step_type: currentStep.step_type,
        };
        saveLead(false);
      }
      
      // Check if next step is thank_you
      const nextStep = STEPS_DATA[currentStepIndex + 1];
      if (nextStep && nextStep.step_type === 'thank_you') {
        saveLead(true);
      }
      
      if (currentStepIndex < STEPS_DATA.length - 1) {
        currentStepIndex++;
        renderFunnel();
      }
    }
    
    function handleTextSubmit(index) {
      const input = document.getElementById('text-input-' + index);
      if (input && input.value.trim()) {
        handleNext(input.value.trim());
      }
    }
    
    function handleEmailSubmit(index) {
      const input = document.getElementById('email-input-' + index);
      if (input && input.value.trim()) {
        handleNext({ email: input.value.trim() });
      }
    }
    
    function handlePhoneSubmit(index) {
      const input = document.getElementById('phone-input-' + index);
      if (input && input.value.trim()) {
        handleNext({ phone: input.value.trim() });
      }
    }
    
    function handleOptInSubmit(index) {
      const name = document.getElementById('name-input-' + index)?.value?.trim();
      const email = document.getElementById('optin-email-' + index)?.value?.trim();
      const phone = document.getElementById('optin-phone-' + index)?.value?.trim();
      
      if (email || phone) {
        handleNext({ name, email, phone, optIn: true });
      }
    }
    
    function handleOptionSelect(element, stepIndex, value) {
      // Deselect others
      const container = element.parentElement;
      container.querySelectorAll('.option-card').forEach(card => card.classList.remove('selected'));
      element.classList.add('selected');
      
      // Enable button
      const btn = document.getElementById('multi-next-' + stepIndex);
      if (btn) {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
      
      // Store selection
      const currentStep = STEPS_DATA[currentStepIndex];
      answers[currentStep.id] = {
        value,
        step_type: currentStep.step_type,
      };
    }
    
    async function saveLead(isComplete) {
      try {
        const response = await fetch(SUPABASE_URL + '/functions/v1/submit-funnel-lead', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            funnel_id: FUNNEL_DATA.id,
            lead_id: leadId,
            answers: answers,
            calendly_booking: calendlyBookingData,
            is_complete: isComplete,
          }),
        });
        
        const data = await response.json();
        if (data.lead_id) {
          leadId = data.lead_id;
          console.log('Lead saved:', leadId, isComplete ? '(complete)' : '(partial)');
        }
      } catch (err) {
        console.error('Failed to save lead:', err);
      }
    }
  </script>
</body>
</html>`;
}
