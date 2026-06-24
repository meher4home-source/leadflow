import { useNavigate } from 'react-router-dom'

export default function LandingPage() {
  const nav = useNavigate()
  return (
    <div style={{minHeight:'100vh',background:'#0f172a',color:'#fff',fontFamily:'Inter,sans-serif'}}>
      {/* NAV */}
      <nav style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 40px',borderBottom:'1px solid rgba(255,255,255,.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:36,height:36,background:'#3b82f6',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏠</div>
          <span style={{fontWeight:800,fontSize:16}}>LeadFlow AI</span>
        </div>
        <div style={{display:'flex',gap:12}}>
          <button onClick={()=>nav('/pricing')} style={{background:'transparent',border:'1px solid rgba(255,255,255,.15)',color:'#fff',padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Pricing</button>
          <button onClick={()=>nav('/login')} style={{background:'transparent',border:'1px solid rgba(255,255,255,.15)',color:'#fff',padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Log In</button>
          <button onClick={()=>nav('/signup')} style={{background:'#3b82f6',border:'none',color:'#fff',padding:'8px 18px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer'}}>Start Free</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{textAlign:'center',padding:'80px 20px 60px',maxWidth:760,margin:'0 auto'}}>
        <div style={{display:'inline-block',background:'rgba(59,130,246,.15)',border:'1px solid rgba(59,130,246,.3)',borderRadius:20,padding:'5px 16px',fontSize:12,fontWeight:600,color:'#60a5fa',marginBottom:24}}>
          AI-Powered Lead Qualifier
        </div>
        <h1 style={{fontSize:'clamp(32px,5vw,56px)',fontWeight:800,lineHeight:1.15,marginBottom:20,letterSpacing:'-1px'}}>
          Stop Losing Leads.<br />
          <span style={{color:'#3b82f6'}}>Let AI Close Them.</span>
        </h1>
        <p style={{fontSize:18,color:'#94a3b8',lineHeight:1.65,marginBottom:36,maxWidth:540,margin:'0 auto 36px'}}>
          Your leads get an AI response in 60 seconds. AI qualifies them. You only call the ones ready to close.
        </p>
        <div style={{display:'flex',gap:12,justifyContent:'center',flexWrap:'wrap'}}>
          <button onClick={()=>nav('/signup')} style={{background:'#3b82f6',color:'#fff',border:'none',padding:'14px 32px',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'}}>
            Start Free — No Card Needed →
          </button>
          <button onClick={()=>nav('/pricing')} style={{background:'transparent',color:'#fff',border:'1px solid rgba(255,255,255,.2)',padding:'14px 32px',borderRadius:10,fontSize:15,fontWeight:600,cursor:'pointer'}}>
            See Pricing
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:20,maxWidth:800,margin:'0 auto 60px',padding:'0 20px'}}>
        {[
          {val:'60 sec',label:'AI response time'},
          {val:'10×',label:'More leads qualified'},
          {val:'$0',label:'To start today'},
          {val:'24/7',label:'AI works for you'},
        ].map(s => (
          <div key={s.val} style={{background:'rgba(255,255,255,.05)',border:'1px solid rgba(255,255,255,.08)',borderRadius:12,padding:'24px 20px',textAlign:'center'}}>
            <div style={{fontSize:32,fontWeight:800,color:'#3b82f6',marginBottom:4}}>{s.val}</div>
            <div style={{fontSize:13,color:'#64748b'}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* HOW IT WORKS */}
      <div style={{maxWidth:800,margin:'0 auto 80px',padding:'0 20px'}}>
        <h2 style={{textAlign:'center',fontSize:28,fontWeight:800,marginBottom:40}}>How It Works</h2>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:20}}>
          {[
            {icon:'📋',step:'1',title:'Lead fills your form',desc:'They submit their info on your landing page — 100% legal SMS consent.'},
            {icon:'🤖',step:'2',title:'AI texts them in 60 sec',desc:'AI asks qualifying questions — condition, price, urgency. 24/7 automatically.'},
            {icon:'✅',step:'3',title:'Dashboard shows CALL NOW',desc:'Only hot, ready leads appear on top. No more guessing who to call.'},
            {icon:'💰',step:'4',title:'You close the deal',desc:'One click posts the deal to your buyer list. $5k–$20k profit per close.'},
          ].map(s => (
            <div key={s.step} style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:12,padding:24}}>
              <div style={{fontSize:28,marginBottom:12}}>{s.icon}</div>
              <div style={{fontSize:11,fontWeight:700,color:'#3b82f6',textTransform:'uppercase',letterSpacing:1,marginBottom:6}}>Step {s.step}</div>
              <div style={{fontSize:14,fontWeight:700,marginBottom:8}}>{s.title}</div>
              <div style={{fontSize:13,color:'#64748b',lineHeight:1.6}}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{textAlign:'center',padding:'60px 20px 80px',borderTop:'1px solid rgba(255,255,255,.07)'}}>
        <h2 style={{fontSize:28,fontWeight:800,marginBottom:12}}>Ready to stop missing deals?</h2>
        <p style={{color:'#64748b',marginBottom:28}}>Free plan includes 10 leads/month. No credit card needed.</p>
        <button onClick={()=>nav('/signup')} style={{background:'#3b82f6',color:'#fff',border:'none',padding:'14px 36px',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer'}}>
          Get Started Free →
        </button>
      </div>
    </div>
  )
}
