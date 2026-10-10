// Browser Speech Recognition and Speech Synthesis helper

export interface SpeechRecognitionWrapper {
  start: () => void;
  stop: () => void;
  isListening: boolean;
}

export function isSpeechRecognitionSupported(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export function createSpeechRecognizer(
  onResult: (transcript: string, isFinal: boolean) => void,
  onError: (err: string) => void,
  onEnd: () => void
): SpeechRecognitionWrapper | null {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    onError('Browser does not support Web Speech Recognition.');
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';

  let isListening = false;

  recognition.onresult = (event: any) => {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (finalTranscript) {
      onResult(finalTranscript, true);
    } else if (interimTranscript) {
      onResult(interimTranscript, false);
    }
  };

  recognition.onerror = (event: any) => {
    onError(event.error || 'Speech recognition error');
  };

  recognition.onend = () => {
    isListening = false;
    onEnd();
  };

  return {
    start: () => {
      try {
        recognition.start();
        isListening = true;
      } catch (e) {
        console.error('Failed to start speech recognition', e);
      }
    },
    stop: () => {
      try {
        recognition.stop();
        isListening = false;
      } catch (e) {
        console.error('Failed to stop speech recognition', e);
      }
    },
    get isListening() {
      return isListening;
    }
  };
}

export function speakText(
  text: string,
  onStart?: () => void,
  onEnd?: () => void
): void {
  if (!('speechSynthesis' in window)) {
    console.warn('Speech synthesis not supported');
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel(); // Stop ongoing speech

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  utterance.lang = 'en-US';

  // Select professional English voice if available
  const voices = window.speechSynthesis.getVoices();
  const selectedVoice = voices.find(
    (v) => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel'))
  ) || voices.find((v) => v.lang.startsWith('en'));

  if (selectedVoice) {
    utterance.voice = selectedVoice;
  }

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
