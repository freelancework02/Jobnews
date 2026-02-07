
document.addEventListener("DOMContentLoaded", function(){

    // Your Monetag links
    const ads=[
    "https://otieu.com/4/10577672",
    "https://otieu.com/4/10577673",
    "https://otieu.com/4/10577678",
    "https://otieu.com/4/10577671",
    "https://otieu.com/4/10577630",
    "https://otieu.com/4/10577680",
    "https://otieu.com/4/10577677"
    ];
    
    function getAd(){ return ads[Math.floor(Math.random()*ads.length)]; }
    function openAd(){ window.open(getAd(), '_blank'); }
    
    // ---------- Popup banner ----------
    const popupHTML = `
    <div id="adOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,.7);display:none;z-index:999999;">
      <div id="adPopup" style="background:#fff;width:90%;max-width:420px;margin:22% auto;border-radius:16px;overflow:hidden;font-family:Arial;text-align:center;position:relative;">
        <div id="closePop" style="position:absolute;top:6px;right:10px;font-size:20px;cursor:pointer;">✖</div>
        <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f" style="width:100%;height:220px;object-fit:cover;">
        <div class="box" style="padding:14px;">
          <h2>Special Online Reward</h2>
          <p>Limited time offer</p>
          <button id="popupBtn" style="background:#1a73e8;color:#fff;border:none;padding:12px 22px;border-radius:8px;cursor:pointer;">Open Now</button>
        </div>
      </div>
    </div>`;
    document.body.insertAdjacentHTML("beforeend", popupHTML);
    
    const popupOverlay = document.getElementById("adOverlay");
    const popupBtn = document.getElementById("popupBtn");
    const closePop = document.getElementById("closePop");
    
    // Show popup once
    if(!localStorage.getItem("popupShown")){
      setTimeout(()=>{
        popupOverlay.style.display = "block";
        localStorage.setItem("popupShown","yes");
      },3000);
    }
    
    // Popup click actions
    if(popupBtn) popupBtn.onclick = openAd;
    if(closePop) closePop.onclick = function() {
        popupOverlay.style.display = "none";
        openAd();
    };
    
    // ---------- First click ad (1 time) ----------
    document.addEventListener("click", function(e){
      // Don't trigger if clicking on the popup close button or button itself (handled above)
      if (e.target.closest('#adPopup')) return;
      
      if(!sessionStorage.getItem("firstClickDone")){
        sessionStorage.setItem("firstClickDone","yes");
        openAd();
      }
    },{once:true});
    
    // ---------- Native banner ----------
    const nativeHTML = `
    <div id="nativeBanner" style="display:none;border:1px solid #dadce0;border-radius:10px;padding:12px;margin:25px 0;font-family:Arial;cursor:pointer;background:#fff;box-shadow:0 2px 5px rgba(0,0,0,0.1);">
    <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085" style="width:100%;border-radius:8px;margin-bottom:8px;height:180px;object-fit:cover;">
    <h3 style="color:#1a0dab;margin:4px 0;">Earn From Home Easily</h3>
    <p style="color:#4d5156;font-size:14px;">Tap to continue and unlock bonus</p>
    </div>`;
    
    // Find a good place to insert the native banner. 
    // Ideally after the main content or inside the article.
    // We'll try to find 'main' or just append to body if not found, but appending to body might be too low.
    const mainContent = document.querySelector('main') || document.querySelector('.container') || document.body;
    mainContent.insertAdjacentHTML("beforeend", nativeHTML);
    
    const nativeBanner = document.getElementById("nativeBanner");
    if(nativeBanner) nativeBanner.onclick = openAd;
    
    // Show native banner once when user scrolls half page
    let nativeShown = false;
    window.addEventListener("scroll", function(){
      if(nativeShown) return;
      if(!nativeBanner) return;
      
      const scrollPos = window.scrollY + window.innerHeight;
      if(scrollPos > document.body.scrollHeight/2){
        nativeShown = true;
        nativeBanner.style.display = "block";
      }
    });
    
    });
