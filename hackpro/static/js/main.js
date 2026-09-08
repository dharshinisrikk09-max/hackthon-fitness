// ==========================================================================
// FITPRO PERSONAL TUTOR - MAIN JAVASCRIPT
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const trainerCards = document.querySelectorAll('.trainer-card');
  const trainerModal = document.getElementById('trainerModal');
  const remembranceModal = document.getElementById('remembranceModal');
  const closeTrainerModalBtn = document.getElementById('closeTrainerModal');
  const closeRemembranceBtn = document.getElementById('closeRemembrance');
  
  // Modal detail targets
  const modalAvatar = document.getElementById('modalAvatar');
  const modalName = document.getElementById('modalName');
  const modalSpecialty = document.getElementById('modalSpecialty');
  const modalTag = document.getElementById('modalTag');
  const modalExperience = document.getElementById('modalExperience');
  const modalAchievements = document.getElementById('modalAchievements');
  const modalFeedback = document.getElementById('modalFeedback');
  const modalRating = document.getElementById('modalRating');
  
  // Modal action buttons
  const btnConsult = document.getElementById('btnConsult');
  const btnConfirm = document.getElementById('btnConfirm');
  
  // Remembrance modal elements
  const remembranceTitle = document.getElementById('remembranceTitle');
  const remembranceMsg = document.getElementById('remembranceMsg');
  const remembranceIcon = document.getElementById('remembranceIcon');
  
  // State
  let currentTrainer = null;
  let userSession = null;

  // Fetch initial session state
  async function refreshSessionState() {
    try {
      const res = await fetch('/api/session');
      if (res.ok) {
        userSession = await res.json();
        updateQuotaDisplay();
      }
    } catch (err) {
      console.error('Error loading session state:', err);
    }
  }

  function updateQuotaDisplay() {
    if (!userSession) return;
    const consultBadge = document.getElementById('consultRemainingBadge');
    const discontBadge = document.getElementById('discontRemainingBadge');
    
    if (consultBadge) {
      consultBadge.textContent = `${userSession.consultations_remaining} / ${userSession.max_consultations}`;
    }
    if (discontBadge) {
      discontBadge.textContent = `${userSession.discontinues_remaining} / ${userSession.max_discontinuations}`;
    }
  }

  // Handle touching / clicking trainer cards
  trainerCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const trainerData = {
        id: parseInt(card.dataset.id),
        name: card.dataset.name,
        experience: card.dataset.experience,
        specializedField: card.dataset.field,
        majorAchievements: card.dataset.achievements,
        clientFeedback: card.dataset.feedback,
        icon: card.dataset.icon,
        tag: card.dataset.tag,
        rating: card.dataset.rating
      };

      // Rule: "One time conform pannitaa consult or conformation nu keka koodaatu"
      // If user already confirmed this trainer, directly navigate to their coaching page!
      if (userSession && userSession.confirmed_trainer_id === trainerData.id) {
        showToast(`Opening coaching dashboard with your confirmed tutor ${trainerData.name}...`);
        setTimeout(() => {
          window.location.href = `/experts/coach/${trainerData.id}`;
        }, 300);
        return;
      }

      openTrainerDetailsModal(trainerData);
    });
  });

  function openTrainerDetailsModal(trainer) {
    currentTrainer = trainer;
    
    // Populate modal contents
    modalAvatar.src = trainer.icon;
    modalAvatar.alt = trainer.name;
    modalName.textContent = trainer.name;
    modalSpecialty.textContent = trainer.specializedField;
    modalTag.textContent = trainer.tag || 'ELITE COACH';
    modalExperience.textContent = trainer.experience;
    modalAchievements.textContent = trainer.majorAchievements;
    modalFeedback.textContent = `“${trainer.clientFeedback}”`;
    modalRating.textContent = `★ ${trainer.rating} / 5.0`;

    // Configure confirm button text depending on if another coach is active
    if (userSession && userSession.confirmed_trainer_id && userSession.confirmed_trainer_id !== trainer.id) {
      btnConfirm.textContent = `Switch & Confirm ${trainer.name.split(' ')[0]}`;
    } else {
      btnConfirm.textContent = `Confirm & Start Coaching`;
    }

    trainerModal.classList.add('active');
  }

  function closeTrainerModal() {
    trainerModal.classList.remove('active');
    currentTrainer = null;
  }

  // Show Remembrance Warning Modal
  function showRemembrance(title, message, type = 'warning') {
    remembranceTitle.textContent = title;
    remembranceMsg.textContent = message;
    
    remembranceIcon.className = `remembrance-icon ${type}`;
    if (type === 'danger') {
      remembranceIcon.textContent = '⛔';
    } else if (type === 'warning') {
      remembranceIcon.textContent = '⚠️';
    } else {
      remembranceIcon.textContent = '✅';
    }

    remembranceModal.classList.add('active');
  }

  function closeRemembranceModal() {
    remembranceModal.classList.remove('active');
  }

  // Handle Consultation Action
  btnConsult.addEventListener('click', async () => {
    if (!currentTrainer) return;

    btnConsult.disabled = true;
    btnConsult.textContent = 'Checking...';

    try {
      const res = await fetch('/api/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_id: currentTrainer.id })
      });

      const data = await res.json();
      btnConsult.disabled = false;
      btnConsult.textContent = 'Book Consultation';

      if (data.success) {
        closeTrainerModal();
        await refreshSessionState();
        showRemembrance(
          'Consultation Booked!',
          `${data.message}\n\n${data.remembrance}`,
          'success'
        );
      } else {
        // Limit exceeded or error
        closeTrainerModal();
        showRemembrance(
          'Consultation Limit Reached',
          data.remembrance || data.message || 'Consultation limit exceeded.',
          'danger'
        );
      }
    } catch (err) {
      btnConsult.disabled = false;
      btnConsult.textContent = 'Book Consultation';
      showToast('Network error occurred. Please try again.', true);
    }
  });

  // Handle Confirmation Action
  btnConfirm.addEventListener('click', async () => {
    if (!currentTrainer) return;

    btnConfirm.disabled = true;
    btnConfirm.textContent = 'Confirming...';

    try {
      const res = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainer_id: currentTrainer.id })
      });

      const data = await res.json();
      if (data.success && data.redirect_url) {
        showToast('Confirmation Successful! Redirecting to coach dashboard...');
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 500);
      } else {
        btnConfirm.disabled = false;
        btnConfirm.textContent = 'Confirm & Start Coaching';
        showToast(data.message || 'Confirmation failed.', true);
      }
    } catch (err) {
      btnConfirm.disabled = false;
      btnConfirm.textContent = 'Confirm & Start Coaching';
      showToast('Network error occurred during confirmation.', true);
    }
  });

  // Modal Closers
  if (closeTrainerModalBtn) {
    closeTrainerModalBtn.addEventListener('click', closeTrainerModal);
  }
  if (closeRemembranceBtn) {
    closeRemembranceBtn.addEventListener('click', closeRemembranceModal);
  }

  // Backdrop clicks
  trainerModal.addEventListener('click', (e) => {
    if (e.target === trainerModal) closeTrainerModal();
  });
  remembranceModal.addEventListener('click', (e) => {
    if (e.target === remembranceModal) closeRemembranceModal();
  });

  // Keyboard Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeTrainerModal();
      closeRemembranceModal();
    }
  });

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

  // Reset Session Demo Button (if available)
  const resetDemoBtn = document.getElementById('resetDemoBtn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', async () => {
      if (confirm('Reset all demo limits (consultations and discontinuations)?')) {
        await fetch('/api/reset', { method: 'POST' });
        window.location.reload();
      }
    });
  }

  // Initialize
  refreshSessionState();
});
