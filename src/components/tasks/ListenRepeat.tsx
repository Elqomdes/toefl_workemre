import type { ListenRepeatSet } from '../../types'
import type { TaskProps } from '../ui'
import SpeakingSequence from './SpeakingSequence'

const responseSeconds = (sentence: string) => Math.min(16, Math.max(7, Math.round(4 + sentence.split(/\s+/).length * 0.7)))

export default function ListenRepeat({ set, onSubmit, strict }: TaskProps<ListenRepeatSet>) {
  return (
    <SpeakingSequence
      title="Listen and Repeat"
      subtitle={set.title}
      intro={
        <div className="rounded-lg bg-brand-50 p-4">
          <p className="mb-1 text-sm font-semibold text-brand-700">Durum</p>
          <p>{set.context}</p>
          <p className="mt-2 text-sm text-slate-600">
            {set.sentences.length} cümle duyacaksın. Her birini duyduğun gibi, aynen tekrar et. Cümleler giderek uzar.
          </p>
        </div>
      }
      items={set.sentences.map((s) => ({ speech: s, voice: 'female', responseSeconds: responseSeconds(s), hint: s }))}
      showLiveTranscript={!strict}
      onDone={(answers) => onSubmit({ type: 'listenRepeat', answers })}
    />
  )
}
