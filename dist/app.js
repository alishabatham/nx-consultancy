/* ==========================================================================
   NX CONSULTANCY — EXECUTIVE THEME APP JS
   Handles: Navigation, Modals, Form Submissions to consultancy@nexisparkx.com
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // 1. Mobile Menu Toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.getElementById('navLinks');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
      });
    });
  }

  // 2. Active Link on Scroll
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const scrollY = window.pageYOffset;
    sections.forEach(current => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');
      const navItem = document.querySelector(`.nav-links a[href*=${sectionId}]`);

      if (navItem) {
        if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
          navItem.classList.add('active');
        } else {
          navItem.classList.remove('active');
        }
      }
    });
  });

  // 3. Consultation Request Modal Logic
  const openModalBtns = document.querySelectorAll('.open-modal-btn');
  const closeModalBtn = document.getElementById('closeModal');
  const consultationModal = document.getElementById('consultationModal');
  const consultationForm = document.getElementById('consultationForm');
  const formSuccessMsg = document.getElementById('formSuccessMsg');
  const resetFormBtn = document.getElementById('resetFormBtn');

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      if (consultationModal) {
        consultationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeModalBtn && consultationModal) {
    closeModalBtn.addEventListener('click', () => {
      consultationModal.classList.remove('active');
      document.body.style.overflow = '';
    });

    consultationModal.addEventListener('click', (e) => {
      if (e.target === consultationModal) {
        consultationModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

  // Official Destination Email Address
  const destinationEmail = 'hr@nexisparkx.com';

  // Form Submit Handler -> Saves to MongoDB (consultancy collection) & Sends email to consultancy@nexisparkx.com
  if (consultationForm) {
    consultationForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = consultationForm.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn.innerHTML;

      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Saving & Sending Request...</span>`;

      const name = document.getElementById('fullName').value;
      const email = document.getElementById('email').value;
      const businessType = document.getElementById('businessType').value;
      const serviceNeeded = document.getElementById('serviceNeeded').value;
      const challenge = document.getElementById('challengeDescription').value;

      const mongoPayload = {
        fullName: name,
        email: email,
        businessType: businessType,
        serviceNeeded: serviceNeeded,
        challengeDescription: challenge
      };

      // Construct Form Payload for Web3Forms Email API
      const emailFormData = {
        access_key: "099a4c58-47fb-44ef-bcae-94186c3d1fb5",
        subject: `New Strategy Consultation Request from ${name}`,
        from_name: name,
        email: email,
        business_stage: businessType,
        service_requested: serviceNeeded,
        message: challenge,
        to_email: destinationEmail
      };

      try {
        // 1. Save to MongoDB Atlas collection 'consultancy' via Express API
        const dbPromise = fetch('/api/consultations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mongoPayload)
        }).then(res => res.json()).then(data => {
          console.log('MongoDB Response:', data);
        }).catch(err => console.error('MongoDB save error:', err));

        // 2. Send email via Web3Forms API
        const emailPromise = fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(emailFormData)
        }).catch(err => console.error('Email notification error:', err));

        await Promise.allSettled([dbPromise, emailPromise]);

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        consultationForm.style.display = 'none';
        formSuccessMsg.classList.add('active');
        consultationForm.reset();

      } catch (error) {
        console.error('Error handling form submission:', error);
        
        // Fallback: Mailto link dispatch if offline
        const mailtoSubject = encodeURIComponent(`Consultation Request from ${name}`);
        const mailtoBody = encodeURIComponent(
          `Name: ${name}\nEmail: ${email}\nBusiness Stage: ${businessType}\nService Needed: ${serviceNeeded}\n\nChallenge/Goal:\n${challenge}`
        );
        window.location.href = `mailto:${destinationEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        consultationForm.style.display = 'none';
        formSuccessMsg.classList.add('active');
        consultationForm.reset();
      }
    });
  }

  if (resetFormBtn && consultationForm && formSuccessMsg) {
    resetFormBtn.addEventListener('click', () => {
      formSuccessMsg.classList.remove('active');
      consultationForm.style.display = 'flex';
    });
  }

  // 4. Service Detail Modal Logic
  const serviceDetailModal = document.getElementById('serviceDetailModal');
  const closeServiceModal = document.getElementById('closeServiceModal');
  const openServiceBtns = document.querySelectorAll('.open-service-detail');

  const sdTag = document.getElementById('sdTag');
  const sdTitle = document.getElementById('sdTitle');
  const sdIntro = document.getElementById('sdIntro');
  const sdBody = document.getElementById('sdBody');

  const serviceData = {
    startup: {
      tag: "🚀 STARTUP CONSULTING",
      title: "Idea Validation to Go-To-Market Execution",
      intro: "For founders building or launching a new venture from ground zero.",
      body: `
        <div class="sd-details">
          <h4>We Help You With:</h4>
          <ul>
            <li><strong>Idea Validation:</strong> Testing product-market fit and customer demand.</li>
            <li><strong>Business Model:</strong> Revenue streams, unit economics, pricing strategies.</li>
            <li><strong>Market Understanding:</strong> TAM/SAM analysis, competitor positioning.</li>
            <li><strong>Launch Planning & Roadmap:</strong> Step-by-step launch timeline and GTM execution.</li>
            <li><strong>Go-To-Market & Growth:</strong> Customer acquisition channels and early adoption funnels.</li>
          </ul>
        </div>
      `
    },
    business: {
      tag: "💼 BUSINESS CONSULTING",
      title: "Optimizing Operations & Accelerating Growth",
      intro: "For established businesses looking to solve problems and improve performance.",
      body: `
        <div class="sd-details">
          <h4>We Help You With:</h4>
          <ul>
            <li><strong>Business Analysis:</strong> Operational audits to eliminate margin bottlenecks.</li>
            <li><strong>Process Improvement:</strong> Standardizing workflows and operational SOPs.</li>
            <li><strong>Growth & Revenue Strategy:</strong> Scaling sales pipelines and market expansion.</li>
            <li><strong>Operational Execution:</strong> Implementation support for lasting impact.</li>
          </ul>
        </div>
      `
    },
    research: {
      tag: "🔎 RESEARCH & ANALYSIS",
      title: "Turning Data into Actionable Business Insights",
      intro: "Rigorous qualitative and quantitative research tailored to your industry.",
      body: `
        <div class="sd-details">
          <h4>We Work On:</h4>
          <ul>
            <li><strong>Market & Competitor Research:</strong> In-depth industry benchmarks.</li>
            <li><strong>Customer Research & Surveys:</strong> Buyer behavior and feedback analysis.</li>
            <li><strong>Feasibility Analysis:</strong> De-risking new product or market entries.</li>
          </ul>
        </div>
      `
    },
    marketing: {
      tag: "📣 MARKETING CONSULTING",
      title: "Strategic Communication & Managed Marketing Execution",
      intro: "We help businesses understand what to communicate, to whom, where, and how.",
      body: `
        <div class="sd-details">
          <h4>We Help You With:</h4>
          <ul>
            <li><strong>Marketing Strategy & Brand Positioning:</strong> Defining your unique value proposition.</li>
            <li><strong>Campaign Planning & Acquisition:</strong> Designing high-converting campaigns.</li>
            <li><strong>Team Execution & Management:</strong> If required, we assign and coordinate specialized marketing teams to execute.</li>
          </ul>
        </div>
      `
    },
    tech: {
      tag: "💻 TECHNOLOGY CONSULTING",
      title: "Bridging Business Requirements & Technical Delivery",
      intro: "Aligning digital solutions with long-term business strategy.",
      body: `
        <div class="sd-details">
          <h4>We Help You With:</h4>
          <ul>
            <li><strong>Requirement Analysis & Product Roadmaps:</strong> Technical scoping and planning.</li>
            <li><strong>Digital Solutions Planning:</strong> Website, application, and portal planning.</li>
            <li><strong>Coordinated Execution:</strong> Handled in synergy with <strong>NX Technologies</strong> for tech execution.</li>
          </ul>
        </div>
      `
    },
    execution: {
      tag: "⚙️ EXECUTION MANAGEMENT",
      title: "Strategy Managed to Full Implementation",
      intro: "Strategy is only valuable when it gets executed. We coordinate resources and teams.",
      body: `
        <div class="sd-details">
          <h4>We Support:</h4>
          <ul>
            <li><strong>Project & Team Coordination:</strong> Task management and sprint tracking.</li>
            <li><strong>Vendor & Execution Tracking:</strong> Milestone reviews and performance monitoring.</li>
          </ul>
        </div>
      `
    }
  };

  openServiceBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.getAttribute('data-service');
      const data = serviceData[key];

      if (data && serviceDetailModal) {
        sdTag.textContent = data.tag;
        sdTitle.textContent = data.title;
        sdIntro.textContent = data.intro;
        sdBody.innerHTML = data.body;

        serviceDetailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });
  });

  if (closeServiceModal && serviceDetailModal) {
    closeServiceModal.addEventListener('click', () => {
      serviceDetailModal.classList.remove('active');
      document.body.style.overflow = '';
    });

    serviceDetailModal.addEventListener('click', (e) => {
      if (e.target === serviceDetailModal) {
        serviceDetailModal.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  }

});
