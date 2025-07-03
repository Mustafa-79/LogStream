export const LandingPage = () => (
  <div class="oj-web-applayout-page" style="
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 70vh;
    padding: 40px;
    text-align: center;
  ">
    {/* Hero Section */}
    <div style="max-width: 800px; margin: 0 auto;">
      {/* Logo/Icon */}
      <div style="margin-bottom: 32px;">
        <span class="oj-ux-ico-dashboard" style="
          font-size: 4rem; 
          color: #6366f1; 
          display: block; 
          margin-bottom: 16px;
        "></span>
      </div>

      {/* Title */}
      <h1 style="
        font-size: 4rem; 
        font-weight: 700; 
        margin: 0 0 24px 0; 
        font-family: 'Poppins', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-align: center;
      ">
        LogStream
      </h1>

      {/* Subtitle */}
      <p style="
        font-size: 1.25rem; 
        color: #6b7280; 
        margin: 0 0 48px 0; 
        font-family: 'Poppins', sans-serif;
        line-height: 1.6;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
      ">
        Real-time application monitoring and log management platform. 
        Monitor your applications, track errors, and analyze performance metrics all in one place.
      </p>

      {/* Get Started Button */}
      <oj-button
        class="oj-button-primary"
        // onojAction={onNavigateToDashboard}
        style="
          --oj-button-bg-color: #6366f1 !important; 
          --oj-button-text-color: white !important; 
          border: none !important;
          border-radius: 12px !important;
          padding: 16px 32px !important;
          font-size: 1.125rem !important;
          font-weight: 600 !important;
          font-family: 'Poppins', sans-serif !important;
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.4) !important;
          transition: all 0.3s ease !important;
        "
      >
        <span slot="startIcon" class="oj-ux-ico-arrow-right" style="margin-right: 8px;"></span>
        Get Started
      </oj-button>

      {/* Feature Cards */}
      <div class="oj-flex oj-flex-wrap oj-justify-content-center" style="gap: 24px; margin-top: 64px;">
        <div class="oj-panel oj-panel-shadow-sm" style="
          flex: 1;
          max-width: 250px;
          min-width: 200px;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          text-align: center;
        ">
          <span class="oj-ux-ico-activity-stream" style="
            font-size: 2.5rem; 
            color: #10b981; 
            display: block; 
            margin-bottom: 16px;
          "></span>
          <h3 style="
            margin: 0 0 8px 0; 
            font-size: 1.125rem; 
            font-weight: 600; 
            color: #111827; 
            font-family: 'Poppins', sans-serif;
          ">
            Real-time Monitoring
          </h3>
          <p style="
            margin: 0; 
            color: #6b7280; 
            font-size: 0.875rem; 
            font-family: 'Poppins', sans-serif;
            line-height: 1.5;
          ">
            Monitor your applications in real-time with live log streaming and instant notifications.
          </p>
        </div>

        <div class="oj-panel oj-panel-shadow-sm" style="
          flex: 1;
          max-width: 250px;
          min-width: 200px;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          text-align: center;
        ">
          <span class="oj-ux-ico-bar-chart" style="
            font-size: 2.5rem; 
            color: #3b82f6; 
            display: block; 
            margin-bottom: 16px;
          "></span>
          <h3 style="
            margin: 0 0 8px 0; 
            font-size: 1.125rem; 
            font-weight: 600; 
            color: #111827; 
            font-family: 'Poppins', sans-serif;
          ">
            Analytics & Insights
          </h3>
          <p style="
            margin: 0; 
            color: #6b7280; 
            font-size: 0.875rem; 
            font-family: 'Poppins', sans-serif;
            line-height: 1.5;
          ">
            Get detailed analytics and insights about your application performance and error patterns.
          </p>
        </div>

        <div class="oj-panel oj-panel-shadow-sm" style="
          flex: 1;
          max-width: 250px;
          min-width: 200px;
          padding: 24px;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: white;
          text-align: center;
        ">
          <span class="oj-ux-ico-group" style="
            font-size: 2.5rem; 
            color: #8b5cf6; 
            display: block; 
            margin-bottom: 16px;
          "></span>
          <h3 style="
            margin: 0 0 8px 0; 
            font-size: 1.125rem; 
            font-weight: 600; 
            color: #111827; 
            font-family: 'Poppins', sans-serif;
          ">
            Team Management
          </h3>
          <p style="
            margin: 0; 
            color: #6b7280; 
            font-size: 0.875rem; 
            font-family: 'Poppins', sans-serif;
            line-height: 1.5;
          ">
            Organize your team with user groups and manage access to different applications seamlessly.
          </p>
        </div>
      </div>
    </div>
  </div>
);