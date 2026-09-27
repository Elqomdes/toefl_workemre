import type { TaskResponse, TaskSet } from '../types'
import BuildSentence from './tasks/BuildSentence'
import ChooseResponse from './tasks/ChooseResponse'
import CompleteWords from './tasks/CompleteWords'
import Interview from './tasks/Interview'
import ListenRepeat from './tasks/ListenRepeat'
import ListeningMCQ from './tasks/ListeningMCQ'
import ReadingMCQ from './tasks/ReadingMCQ'
import WritingTask from './tasks/WritingTask'

interface Props {
  set: TaskSet
  onSubmit: (r: TaskResponse) => void
  strict?: boolean
}

export default function TaskRunner({ set, onSubmit, strict }: Props) {
  switch (set.type) {
    case 'completeWords':
      return <CompleteWords set={set} onSubmit={onSubmit} strict={strict} />
    case 'dailyLife':
    case 'academicReading':
      return <ReadingMCQ set={set} onSubmit={onSubmit} strict={strict} />
    case 'chooseResponse':
      return <ChooseResponse set={set} onSubmit={onSubmit} strict={strict} />
    case 'conversation':
    case 'announcement':
    case 'academicTalk':
      return <ListeningMCQ set={set} onSubmit={onSubmit} strict={strict} />
    case 'buildSentence':
      return <BuildSentence set={set} onSubmit={onSubmit} strict={strict} />
    case 'email':
    case 'discussion':
      return <WritingTask set={set} onSubmit={onSubmit} strict={strict} />
    case 'listenRepeat':
      return <ListenRepeat set={set} onSubmit={onSubmit} strict={strict} />
    case 'interview':
      return <Interview set={set} onSubmit={onSubmit} strict={strict} />
  }
}
