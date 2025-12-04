/**
 * نظام الأصوات للتنبيهات والتنبؤات
 */

export type SoundType = 'alert' | 'prediction' | 'warning' | 'critical' | 'info'

class SoundManager {
  private audioContext: AudioContext | null = null
  private sounds: Map<SoundType, AudioBuffer> = new Map()
  private enabled: boolean = true
  private volume: number = 0.7

  constructor() {
    if (typeof window !== 'undefined') {
      this.initAudioContext()
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    } catch (error) {
      console.warn('AudioContext not supported:', error)
    }
  }

  /**
   * توليد صوت تنبيه
   */
  private generateAlertSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.3
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // نغمة تنبيه (800Hz)
    const frequency = 800
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.3
    }

    return buffer
  }

  /**
   * توليد صوت تنبؤ
   */
  private generatePredictionSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.2
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // نغمة تنبؤ (600Hz)
    const frequency = 600
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.2
    }

    return buffer
  }

  /**
   * توليد صوت تحذير
   */
  private generateWarningSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.4
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // نغمة تحذير متعددة (500Hz, 700Hz)
    const frequencies = [500, 700]
    for (let i = 0; i < data.length; i++) {
      let value = 0
      frequencies.forEach(freq => {
        value += Math.sin(2 * Math.PI * freq * i / sampleRate) * 0.15
      })
      data[i] = value
    }

    return buffer
  }

  /**
   * توليد صوت حرج
   */
  private generateCriticalSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.5
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // نغمة حرجة عالية (1000Hz)
    const frequency = 1000
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate
      const envelope = Math.exp(-t * 3) // انخفاض تدريجي
      data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.4
    }

    return buffer
  }

  /**
   * توليد صوت معلومات
   */
  private generateInfoSound(): AudioBuffer | null {
    if (!this.audioContext) return null

    const sampleRate = this.audioContext.sampleRate
    const duration = 0.15
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate)
    const data = buffer.getChannelData(0)

    // نغمة معلومات (400Hz)
    const frequency = 400
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate) * 0.15
    }

    return buffer
  }

  /**
   * تشغيل صوت
   */
  async playSound(type: SoundType) {
    if (!this.enabled || !this.audioContext) return

    try {
      // إعادة تفعيل AudioContext إذا كان معلقاً
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      let buffer: AudioBuffer | null = null

      // توليد أو جلب الصوت
      if (!this.sounds.has(type)) {
        switch (type) {
          case 'alert':
            buffer = this.generateAlertSound()
            break
          case 'prediction':
            buffer = this.generatePredictionSound()
            break
          case 'warning':
            buffer = this.generateWarningSound()
            break
          case 'critical':
            buffer = this.generateCriticalSound()
            break
          case 'info':
            buffer = this.generateInfoSound()
            break
        }
        if (buffer) {
          this.sounds.set(type, buffer)
        }
      } else {
        buffer = this.sounds.get(type) || null
      }

      if (!buffer) return

      // تشغيل الصوت
      const source = this.audioContext.createBufferSource()
      const gainNode = this.audioContext.createGain()
      
      source.buffer = buffer
      gainNode.gain.value = this.volume
      
      source.connect(gainNode)
      gainNode.connect(this.audioContext.destination)
      
      source.start(0)
    } catch (error) {
      console.warn('Error playing sound:', error)
    }
  }

  /**
   * تفعيل/تعطيل الأصوات
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
  }

  /**
   * ضبط مستوى الصوت
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * التحقق من حالة الصوت
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

// إنشاء instance واحد
export const soundManager = typeof window !== 'undefined' ? new SoundManager() : null

