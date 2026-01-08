import type { ConversationConfig, AgentMessage, ConversationState } from '@/types/elevenlabs'

const AGENT_ID = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_2801kec83byre6hs52990btth5ch'

interface AgentOptions {
  onMessage?: (message: AgentMessage) => void
  onStateChange?: (state: ConversationState) => void
  onError?: (error: Error) => void
  context?: string
}

export class JillianAgent {
  private ws: WebSocket | null = null
  private options: AgentOptions
  private state: ConversationState = 'idle'
  private audioContext: AudioContext | null = null
  private mediaRecorder: MediaRecorder | null = null
  private audioQueue: Uint8Array[] = []
  private isPlaying = false

  constructor(options: AgentOptions = {}) {
    this.options = options
  }

  private setState(state: ConversationState) {
    this.state = state
    this.options.onStateChange?.(state)
  }

  async connect(signedUrl: string): Promise<void> {
    this.setState('connecting')

    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(signedUrl)

      this.ws.onopen = () => {
        this.setState('connected')
        
        // Send initial configuration
        if (this.options.context) {
          this.sendMessage({
            type: 'context',
            context: this.options.context,
          })
        }
        
        resolve()
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.handleMessage(data)
        } catch (error) {
          // Binary audio data
          if (event.data instanceof Blob) {
            event.data.arrayBuffer().then((buffer) => {
              this.audioQueue.push(new Uint8Array(buffer))
              this.playAudioQueue()
            })
          }
        }
      }

      this.ws.onerror = (error) => {
        this.setState('error')
        this.options.onError?.(new Error('WebSocket error'))
        reject(error)
      }

      this.ws.onclose = () => {
        this.setState('idle')
      }
    })
  }

  private handleMessage(data: AgentMessage) {
    this.options.onMessage?.(data)

    switch (data.type) {
      case 'agent_response_started':
        this.setState('speaking')
        break
      case 'agent_response_ended':
        this.setState('listening')
        break
      case 'audio':
        if (data.audio) {
          this.audioQueue.push(data.audio)
          this.playAudioQueue()
        }
        break
      case 'error':
        this.setState('error')
        this.options.onError?.(new Error(data.error || 'Unknown error'))
        break
    }
  }

  private async playAudioQueue() {
    if (this.isPlaying || this.audioQueue.length === 0) return

    this.isPlaying = true

    if (!this.audioContext) {
      this.audioContext = new AudioContext()
    }

    while (this.audioQueue.length > 0) {
      const audioData = this.audioQueue.shift()
      if (audioData) {
        try {
          const audioBuffer = await this.audioContext.decodeAudioData(audioData.buffer)
          const source = this.audioContext.createBufferSource()
          source.buffer = audioBuffer
          source.connect(this.audioContext.destination)
          source.start()
          
          // Wait for audio to finish
          await new Promise((resolve) => {
            source.onended = resolve
          })
        } catch (error) {
          console.error('Error playing audio:', error)
        }
      }
    }

    this.isPlaying = false
  }

  async startRecording(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0 && this.ws?.readyState === WebSocket.OPEN) {
          this.ws.send(event.data)
        }
      }

      this.mediaRecorder.start(100) // Send chunks every 100ms
      this.setState('listening')
    } catch (error) {
      this.options.onError?.(error as Error)
    }
  }

  stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop()
      this.mediaRecorder.stream.getTracks().forEach((track) => track.stop())
    }
    this.setState('processing')
  }

  sendMessage(message: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  sendTextMessage(text: string): void {
    this.sendMessage({
      type: 'user_message',
      message: text,
    })
    this.setState('processing')
  }

  disconnect(): void {
    if (this.mediaRecorder) {
      this.stopRecording()
    }
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.setState('idle')
  }

  getState(): ConversationState {
    return this.state
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Factory function to create agent with signed URL
export async function createJillianAgent(
  signedUrl: string,
  options?: AgentOptions
): Promise<JillianAgent> {
  const agent = new JillianAgent(options)
  await agent.connect(signedUrl)
  return agent
}

export { AGENT_ID }
