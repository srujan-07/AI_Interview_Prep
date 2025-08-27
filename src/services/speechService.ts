export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private isListening = false;
  private retryCount = 0;
  private readonly maxRetries = 2;

  constructor() {
    this.synthesis = window.speechSynthesis;
    
    if ('webkitSpeechRecognition' in window) {
      this.recognition = new (window as any).webkitSpeechRecognition();
    } else if ('SpeechRecognition' in window) {
      this.recognition = new (window as any).SpeechRecognition();
    }

    if (this.recognition) {
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
    }
  }

  async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void
  ): Promise<void> {
    if (!this.recognition) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    if (this.isListening) {
      return;
    }

    this.isListening = true;

    this.recognition.onresult = (event) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }

      // Successful result resets retry counter
      if (transcript) {
        this.retryCount = 0;
      }
      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event) => {
      this.isListening = false;
      const err = typeof event.error === 'string' ? event.error : 'unknown_error';
      // Auto-retry on transient errors
      if ((err === 'network' || err === 'no-speech' || err === 'aborted') && this.retryCount < this.maxRetries) {
        this.retryCount += 1;
        try {
          this.recognition?.stop();
        } catch {}
        setTimeout(() => {
          if (!this.isListening) {
            this.startListening(onResult, onError).catch(() => {
              onError?.(err);
            });
          }
        }, 700);
        return;
      }
      onError?.(err);
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.retryCount = 0;
    }
  }

  speak(text: string, options?: { rate?: number; pitch?: number; volume?: number }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!text.trim()) {
        resolve();
        return;
      }

      // Cancel any ongoing speech
      this.synthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate || 1;
      utterance.pitch = options?.pitch || 1;
      utterance.volume = options?.volume || 1;

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(event.error);

      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    this.synthesis.cancel();
  }

  get isCurrentlyListening(): boolean {
    return this.isListening;
  }
}