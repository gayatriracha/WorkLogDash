export async function playNotificationSound(): Promise<void> {
  try {
    // Create audio context
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Resume audio context if it's suspended (required by some browsers)
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }

    // Create oscillator for notification sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure sound - pleasant notification tone
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    oscillator.type = 'sine';

    // Configure volume envelope
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime + 0.2);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);

    // Clean up
    setTimeout(() => {
      audioContext.close();
    }, 600);

  } catch (error) {
    console.warn('Web Audio API not available, falling back to HTML5 audio');
    
    // Fallback: try to use HTML5 audio with data URL
    try {
      // Simple beep sound as data URL
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H2uXUpCSJ+zPLZfywFJnfH8NqQQwoUXrTo66hUFApFnuH2uXUpCSJ+zPLaXywFJnfH8NqQQwoUXrTo66hUFApFnuH2uXUpCSJ+zPLaXywFJnfH8NqQQwoUXrTo66hUFApFnuH2uXUpCSJ+zPLaXywFJnfH8NqQQwoUXrTo66hUFApFnuH2uXUpCSJ+zPLaXywF');
      audio.volume = 0.3;
      await audio.play();
    } catch (fallbackError) {
      console.warn('Audio notification not available:', fallbackError);
      // Could show a visual notification as final fallback
    }
  }
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('This browser does not support desktop notifications');
    return Promise.resolve('denied');
  }

  return Notification.requestPermission();
}

export function showDesktopNotification(title: string, body: string, icon?: string): Notification | null {
  if (!('Notification' in window)) {
    return null;
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false,
    });
  }

  return null;
}
