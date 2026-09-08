// ==========================================================================
// FITPRO PERSONAL TUTOR - DEDICATED COACHING DASHBOARD JAVASCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const trainerId = parseInt(document.body.dataset.trainerId);
  const trainerName = document.body.dataset.trainerName;
  
  // Elements - Phone Call
  const callBtnDial = document.getElementById('callBtnDial');
  const callControlsActive = document.getElementById('callControlsActive');
  const callBtnHangup = document.getElementById('callBtnHangup');
  const callBtnMute = document.getElementById('callBtnMute');
  const callBtnSpeaker = document.getElementById('callBtnSpeaker');
  const callStatusBadge = document.getElementById('callStatusBadge');
  const callTimerDisplay = document.getElementById('callTimerDisplay');
  const audioWaves = document.getElementById('audioWaves');
  
  // Elements - Reviews & Feedback
  const reviewForm = document.getElementById('reviewForm');
  const reviewAuthor = document.getElementById('reviewAuthor');
  const reviewComment = document.getElementById('reviewComment');
  const starRatingSpans = document.querySelectorAll('.star-rating span');
  const reviewsList = document.getElementById('reviewsList');
  const submitReviewBtn = document.getElementById('submitReviewBtn');
  
  // Elements - Discontinue
  const btnDiscontinue = document.getElementById('btnDiscontinue');
  const discontinueModal = document.getElementById('discontinueModal');
  const cancelDiscontinueBtn = document.getElementById('cancelDiscontinue');
  const confirmDiscontinueBtn = document.getElementById('confirmDiscontinue');
  const discontRemainingDisplay = document.getElementById('discontRemainingDisplay');

  // Remembrance modal
  const remembranceModal = document.getElementById('remembranceModal');
  const remembranceTitle = document.getElementById('remembranceTitle');
  const remembranceMsg = document.getElementById('remembranceMsg');
  const remembranceIcon = document.getElementById('remembranceIcon');
  const closeRemembranceBtn = document.getElementById('closeRemembrance');

  // Audio & Call State
  let callState = 'idle'; // 'idle' | 'dialing' | 'connected'
  let callTimerInterval = null;
  let callSeconds = 0;
  let isMuted = false;
  let isSpeakerOn = true;
  let audioCtx = null;
  let ringOscillator = null;

  // Selected Star Rating (Default 5)
  let selectedRating = 5;

  // --- Web Audio Synthesizer for Phone Call Simulation ---
  function getAudioContext() {
    if (!audioCtx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) audioCtx = new AudioCtx();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playRingTone() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(440, now); // 440 Hz
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(480, now); // 480 Hz

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.6);
      osc2.stop(now + 1.6);
    } catch (e) {
      console.log('Audio ringtone tone note:', e);
    }
  }

  function playConnectChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880, now + 0.12); // A5

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } catch (e) {}
  }

  // --- Phone Call Controls ---
  if (callBtnDial) {
    callBtnDial.addEventListener('click', startCall);
  }
  if (callBtnHangup) {
    callBtnHangup.addEventListener('click', endCall);
  }

  function startCall() {
    callState = 'dialing';
    callBtnDial.style.display = 'none';
    callControlsActive.style.display = 'flex';
    callStatusBadge.innerHTML = '<span>📞</span> Calling ' + trainerName + '...';
    callStatusBadge.style.borderColor = '#fbbf24';
    callStatusBadge.style.color = '#fbbf24';

    playRingTone();
    let ringCount = 0;
    const ringInterval = setInterval(() => {
      ringCount++;
      if (callState !== 'dialing') {
        clearInterval(ringInterval);
        return;
      }
      playRingTone();
      if (ringCount >= 2) {
        clearInterval(ringInterval);
        connectCall();
      }
    }, 2000);
  }

  function connectCall() {
    if (callState !== 'dialing') return;
    callState = 'connected';
    playConnectChime();

    callStatusBadge.innerHTML = '<span>🟢</span> Live Audio Session with ' + trainerName;
    callStatusBadge.style.borderColor = 'var(--neon-green)';
    callStatusBadge.style.color = 'var(--neon-green)';
    audioWaves.classList.add('active');

    callSeconds = 0;
    updateTimerText();
    callTimerInterval = setInterval(() => {
      callSeconds++;
      updateTimerText();
    }, 1000);

    showToast(`Connected with ${trainerName}! Speak clearly into your microphone.`);
  }

  function updateTimerText() {
    const mins = Math.floor(callSeconds / 60).toString().padStart(2, '0');
    const secs = (callSeconds % 60).toString().padStart(2, '0');
    callTimerDisplay.textContent = `${mins}:${secs}`;
  }

  function endCall() {
    callState = 'idle';
    clearInterval(callTimerInterval);
    audioWaves.classList.remove('active');

    callBtnDial.style.display = 'inline-flex';
    callControlsActive.style.display = 'none';
    callStatusBadge.innerHTML = '<span>⚡</span> Audio Call Ready';
    callStatusBadge.style.borderColor = 'var(--neon-green)';
    callStatusBadge.style.color = 'var(--neon-green)';
    callTimerDisplay.textContent = '00:00';

    showToast(`Call ended. Duration: ${Math.floor(callSeconds / 60)}m ${callSeconds % 60}s`);
  }

  // Mute toggle
  if (callBtnMute) {
    callBtnMute.addEventListener('click', () => {
      isMuted = !isMuted;
      callBtnMute.classList.toggle('active', isMuted);
      callBtnMute.innerHTML = isMuted ? '🔇' : '🎙️';
      showToast(isMuted ? 'Microphone muted' : 'Microphone unmuted');
    });
  }

  // Speaker toggle
  if (callBtnSpeaker) {
    callBtnSpeaker.addEventListener('click', () => {
      isSpeakerOn = !isSpeakerOn;
      callBtnSpeaker.classList.toggle('active', isSpeakerOn);
      showToast(isSpeakerOn ? 'HD Audio Speaker On' : 'Earpiece Mode');
    });
  }

  // --- Star Rating Selection ---
  starRatingSpans.forEach(span => {
    span.addEventListener('click', () => {
      selectedRating = parseInt(span.dataset.val);
      updateStarDisplay(selectedRating);
    });
  });

  function updateStarDisplay(rating) {
    starRatingSpans.forEach(s => {
      const val = parseInt(s.dataset.val);
      if (val <= rating) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });
  }

  // --- Submit Review & Feedback ---
  if (reviewForm) {
    reviewForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const author = reviewAuthor.value.trim() || 'Verified Athlete';
      const comment = reviewComment.value.trim();

      if (!comment) {
        showToast('Please type your review or feedback.', true);
        return;
      }

      submitReviewBtn.disabled = true;
      submitReviewBtn.textContent = 'Submitting...';

      try {
        const res = await fetch(`/api/reviews/${trainerId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            author: author,
            rating: selectedRating,
            comment: comment
          })
        });

        const data = await res.json();
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = 'Submit Feedback';

        if (data.success) {
          reviewComment.value = '';
          showToast('Feedback submitted successfully!');
          renderNewReview(data.review);
        } else {
          showToast(data.message || 'Failed to submit review.', true);
        }
      } catch (err) {
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = 'Submit Feedback';
        showToast('Network error submitting review.', true);
      }
    });
  }

  function renderNewReview(review) {
    const item = document.createElement('div');
    item.className = 'review-item';
    const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    item.innerHTML = `
      <div class="review-meta">
        <span class="review-author">${escapeHtml(review.author)}</span>
        <span class="review-date">${review.date}</span>
      </div>
      <div class="review-stars">${stars}</div>
      <p class="review-comment">${escapeHtml(review.comment)}</p>
    `;
    reviewsList.prepend(item);
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // --- Discontinue Journey Flow & Constraints ---
  if (btnDiscontinue) {
    btnDiscontinue.addEventListener('click', () => {
      discontinueModal.classList.add('active');
    });
  }

  if (cancelDiscontinueBtn) {
    cancelDiscontinueBtn.addEventListener('click', () => {
      discontinueModal.classList.remove('active');
    });
  }

  if (confirmDiscontinueBtn) {
    confirmDiscontinueBtn.addEventListener('click', async () => {
      confirmDiscontinueBtn.disabled = true;
      confirmDiscontinueBtn.textContent = 'Processing...';

      try {
        const res = await fetch('/api/discontinue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ trainer_id: trainerId })
        });

        const data = await res.json();
        discontinueModal.classList.remove('active');
        confirmDiscontinueBtn.disabled = false;
        confirmDiscontinueBtn.textContent = 'Yes, Discontinue Coaching';

        if (data.success) {
          showRemembrance(
            'Coaching Discontinued',
            `${data.message}\n\n${data.remembrance}`,
            'success'
          );
          setTimeout(() => {
            window.location.href = data.redirect_url || '/';
          }, 1800);
        } else {
          // Discontinue limit exceeded! (Constraint: max 2 times total)
          showRemembrance(
            'Discontinuation Limit Exceeded',
            data.remembrance || 'You have reached the maximum limit of 2 discontinuations.',
            'danger'
          );
        }
      } catch (err) {
        confirmDiscontinueBtn.disabled = false;
        confirmDiscontinueBtn.textContent = 'Yes, Discontinue Coaching';
        showToast('Network error during discontinuation.', true);
      }
    });
  }

  // Remembrance modal handling
  function showRemembrance(title, message, type = 'warning') {
    remembranceTitle.textContent = title;
    remembranceMsg.textContent = message;
    
    remembranceIcon.className = `remembrance-icon ${type}`;
    remembranceIcon.textContent = (type === 'danger') ? '⛔' : (type === 'warning' ? '⚠️' : '✅');

    remembranceModal.classList.add('active');
  }

  if (closeRemembranceBtn) {
    closeRemembranceBtn.addEventListener('click', () => {
      remembranceModal.classList.remove('active');
    });
  }

  // Backdrop clicks
  if (discontinueModal) {
    discontinueModal.addEventListener('click', (e) => {
      if (e.target === discontinueModal) discontinueModal.classList.remove('active');
    });
  }
  if (remembranceModal) {
    remembranceModal.addEventListener('click', (e) => {
      if (e.target === remembranceModal) remembranceModal.classList.remove('active');
    });
  }

  // Toast Notification Utility
  function showToast(msg, isError = false) {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'toast-error' : ''}`;
    toast.innerHTML = `<span>${isError ? '⚠️' : '⚡'}</span><span>${msg}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
});
