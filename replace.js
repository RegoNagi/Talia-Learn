const fs = require('fs');
const content = fs.readFileSync('app/assessment-builder/page.tsx', 'utf-8');

const importTarget = `import { createPortal } from 'react-dom';
import { FloatingPortal } from '@floating-ui/react';`;
const importReplacement = `import { createPortal } from 'react-dom';
import { FloatingPortal } from '@floating-ui/react';
import { AssessmentSidebar } from '@/components/AssessmentSidebar';`;

const stateTarget = `  // Security & Display
  const [isTimed, setIsTimed] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [oneAtATime, setOneAtATime] = useState(false);
  const [showFeedback, setShowFeedback] = useState(true);
  const [aiPlagiarism, setAiPlagiarism] = useState(true);
  const [publishToTimeline, setPublishToTimeline] = useState(true);`;

const stateReplacement = `  // Security & Display
  const [isTimed, setIsTimed] = useState(true);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [oneAtATime, setOneAtATime] = useState(false);
  const [prohibitLateSubmissions, setProhibitLateSubmissions] = useState(false);
  const [prohibitBacktracking, setProhibitBacktracking] = useState(false);
  const [feedbackTiming, setFeedbackTiming] = useState('instantly');
  const [showFeedback, setShowFeedback] = useState(true);
  const [aiPlagiarism, setAiPlagiarism] = useState(true);
  const [publishToTimeline, setPublishToTimeline] = useState(true);`;

const startIndex = content.indexOf('        {/* 3. Inspector Sidebar (Right) */}');
const endIndexStr = '        </aside>\n      </div>';
const endIndex = content.indexOf(endIndexStr, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const replacementSidebar = `        {/* 3. Inspector Sidebar (Right) */}
        <AssessmentSidebar 
          language="en"
          activeTab={activeTab}
          title={title}
          setTitle={setTitle}
          status={status as any}
          setStatus={(s) => setStatus(s as any)}
          category={category}
          setCategory={setCategory}
          isAutoCalc={isAutoCalc}
          setIsAutoCalc={setIsAutoCalc}
          maxScore={maxScore}
          setMaxScore={setMaxScore}
          attemptLimit={attemptLimit}
          setAttemptLimit={setAttemptLimit}
          timeLimitHours={timeLimitHours}
          setTimeLimitHours={setTimeLimitHours}
          timeLimitMinutes={timeLimitMinutes}
          setTimeLimitMinutes={setTimeLimitMinutes}
          dueDate={dueDate}
          setDueDate={setDueDate}
          dueTime={dueTime}
          setDueTime={setDueTime}
          prohibitLateSubmissions={prohibitLateSubmissions}
          setProhibitLateSubmissions={setProhibitLateSubmissions}
          shuffleQuestions={shuffleQuestions}
          setShuffleQuestions={setShuffleQuestions}
          oneAtATime={oneAtATime}
          setOneAtATime={setOneAtATime}
          prohibitBacktracking={prohibitBacktracking}
          setProhibitBacktracking={setProhibitBacktracking}
          feedbackTiming={feedbackTiming}
          setFeedbackTiming={setFeedbackTiming}
          aiPlagiarism={aiPlagiarism}
          setAiPlagiarism={setAiPlagiarism}
          publishToTimeline={publishToTimeline}
          setPublishToTimeline={setPublishToTimeline}
          allowFileUpload={allowFileUpload}
          setAllowFileUpload={setAllowFileUpload}
          allowTextEntry={allowTextEntry}
          setAllowTextEntry={setAllowTextEntry}
          gradingMethod={gradingMethod}
          rubric={rubric as any}
          passPercentage={passPercentage}
          setPassPercentage={setPassPercentage}
          latePenalty={latePenalty}
          setLatePenalty={setLatePenalty}
          lockModule={lockModule}
          setLockModule={setLockModule}
        />
      </div>`;
  const before = content.substring(0, startIndex);
  const after = content.substring(endIndex + endIndexStr.length);
  let newContent = before + replacementSidebar + after;
  newContent = newContent.replace(importTarget, importReplacement);
  newContent = newContent.replace(stateTarget, stateReplacement);
  fs.writeFileSync('app/assessment-builder/page.tsx', newContent);
  console.log('Successfully updated file.');
} else {
  console.error('Could not find sidebar boundaries.');
}
