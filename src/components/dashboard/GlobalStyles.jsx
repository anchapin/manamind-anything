export default function GlobalStyles() {
  return (
    <style jsx global>{`
      :root {
        --gradient-royal-indigo: linear-gradient(135deg, #0054B5 0%, #4A46C9 100%);
        --gradient-purple-indigo: linear-gradient(135deg, #6253D8 0%, #2E2B73 100%);
        --gradient-cyan-blue: linear-gradient(135deg, #0085CE 0%, #004E93 100%);
        --gradient-gunmetal-midnight: linear-gradient(135deg, #222222 0%, #000000 100%);
        --gradient-neural-purple: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
        --gradient-ai-green: linear-gradient(135deg, #10B981 0%, #059669 100%);
      }
      
      .font-barlow {
        font-family: 'Barlow', sans-serif;
      }
      
      .font-inter {
        font-family: 'Inter', sans-serif;
      }
      
      .gradient-royal-indigo {
        background: var(--gradient-royal-indigo);
      }
      
      .gradient-purple-indigo {
        background: var(--gradient-purple-indigo);
      }
      
      .gradient-cyan-blue {
        background: var(--gradient-cyan-blue);
      }
      
      .gradient-gunmetal-midnight {
        background: var(--gradient-gunmetal-midnight);
      }
      
      .gradient-neural-purple {
        background: var(--gradient-neural-purple);
      }
      
      .gradient-ai-green {
        background: var(--gradient-ai-green);
      }
      
      .hover-lift {
        transition: all 0.3s ease;
      }
      
      .hover-lift:hover {
        transform: translateY(-4px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }
      
      .nav-transition {
        transition: color 0.14s ease;
      }
      
      .training-pulse {
        animation: pulse-training 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
      }
      
      @keyframes pulse-training {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.6;
        }
      }
      
      .status-indicator {
        position: relative;
      }
      
      .status-indicator::after {
        content: '';
        position: absolute;
        top: 0;
        right: 0;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        animation: status-pulse 2s ease-in-out infinite;
      }
      
      .status-running::after {
        background-color: #10B981;
      }
      
      .status-paused::after {
        background-color: #F59E0B;
      }
      
      .status-error::after {
        background-color: #EF4444;
      }
      
      @keyframes status-pulse {
        0%, 100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.7;
          transform: scale(1.2);
        }
      }
    `}</style>
  );
}