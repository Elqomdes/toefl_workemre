import type { InterviewSet } from '../../types'
import type { TaskProps } from '../ui'
import SpeakingSequence from './SpeakingSequence'

export default function Interview({ set, onSubmit, strict }: TaskProps<InterviewSet>) {
  return (
    <SpeakingSequence
      title="Take an Interview"
      subtitle={set.title}
      intro={
        <div className="rounded-lg bg-brand-50 p-4">
          <p className="mb-1 text-sm font-semibold text-brand-700">Durum</p>
          <p>{set.intro}</p>
          <p className="mt-2 text-sm text-slate-600">
            {set.questions.length} soru sorulacak. Her soruya bip sesinden sonra <b>45 saniye</b> içinde cevap ver. Hazırlık süresi yoktur.
          </p>
        </div>
      }
      items={set.questions.map((q) => ({ speech: q, display: strict ? undefined : q, voice: 'male', responseSeconds: 45 }))}
      showLiveTranscript={!strict}
      onDone={(answers) => onSubmit({ type: 'interview', answers })}
    />
  )
}
