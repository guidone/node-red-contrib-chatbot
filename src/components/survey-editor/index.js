import React, { useState, useCallback, useEffect } from 'react';
import _ from 'lodash';
import { sortableContainer } from 'react-sortable-hoc';
import PropTypes from 'prop-types';

import './style.scss';
import Question from './views/question';
import QuestionDetail from './views/question-detail';
import SurveyEditorContext from './context';
import { remove, replace, add, getLevels, retag, swap } from './helpers';

const SortableContainer = sortableContainer(({ children }) => {
  return <div className="questions">{children}</div>;
});

const SurveyEditor = ({ value: questions = [{}], onChange = () => {} }) => {
  const [active, setActive] = useState();

  useEffect(() => {
    if (active == null) {
      setActive(!_.isEmpty(questions) ? questions[0].id : null)
    }
  }, [questions])

  const onSortEnd = useCallback(({ oldIndex, newIndex }) => {
    const newQuestions = swap(questions, oldIndex, newIndex);
    onChange(retag(newQuestions));
  });

  const activeQuestion = questions.find(question => question.id === active);
  // get levels, in order to know for every parent what's the indent level
  const levels = getLevels(questions);

  return (
    <SurveyEditorContext.Provider value={{ questions }}>
      <div className="ui-survey-editor">
        <SortableContainer onSortEnd={onSortEnd} helperClass="sorting" useDragHandle>
          {questions.map((question, index) => (
            <Question
              key={question.id}
              index={index}
              question={question}
              level={question.parent != null ? levels[question.parent] : null}
              active={active === question.id}
              onSelect={question => setActive(question.id)}
            />
          ))}
        </SortableContainer>
        <div className="question-detail">
          {activeQuestion != null && (
            <QuestionDetail
              key={activeQuestion.id}
              question={activeQuestion}
              onChange={question => onChange(replace(questions, active, question))}
              onRemove={question => {
                setActive(null);
                onChange(retag(remove(questions, question)))
              }}
              onAdd={params => {
                const { questions: newQuestions, question } = add(questions, params);
                setActive(question.id);
                onChange(newQuestions);
              }}
            />
          )}
        </div>
      </div>
    </SurveyEditorContext.Provider>
  );
};
SurveyEditor.propTypes = {
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  value: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    level: PropTypes.number,
    tag: PropTypes.string,
    title: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['multiple', 'string', 'number', 'image']).isRequired,
    data: PropTypes.oneOfType([
      PropTypes.arrayOf(PropTypes.shape({
        answer: PropTypes.string.isRequired,
        id: PropTypes.string.isRequired,
        jump: PropTypes.string,
        value: PropTypes.string
      }))
    ])
  }))
};

export default SurveyEditor;