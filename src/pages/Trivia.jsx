import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getQuestions } from '../services/triviaAPI';
import '../styles/trivia.css';
import Timer from '../components/Timer';
import { setScore as setScoreAction } from '../actions';
import Header from '../components/Header';

class Trivia extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nextBtn: false,
      questions: [],
      index: 0,
      loading: true,
      isClicked: false,
      answerArray: [],
      verifyAnswer: false,
      resetTimer: false,
    };
    this.fetchAPI = this.fetchAPI.bind(this);
    this.nextFuncBtn = this.nextFuncBtn.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.randomArray = this.randomArray.bind(this);
    this.createBtn = this.createBtn.bind(this);
    this.updateBtn = this.updateBtn.bind(this);
    this.countScore = this.countScore.bind(this);
    this.funcRenderButton = this.funcRenderButton.bind(this);
  }

  componentDidMount() {
    this.fetchAPI();
  }

  componentDidUpdate(prevProps) {
    const { timer } = this.props;
    if (prevProps.timer !== timer) { this.countScore(); }
  }

  async fetchAPI() {
    const questions = await getQuestions();
    this.setState({ questions, loading: false });
  }

  handleClick({ target }) {
    const verifyAnswer = target.id.includes('correct');
    this.setState({
      nextBtn: true,
      isClicked: true,
      verifyAnswer,
    });
  }

  countScore() {
    const { questions, index, verifyAnswer } = this.state;
    const { difficulty } = questions[index];
    const { timer, setScore } = this.props;
    let playerScore = 0;

    if (verifyAnswer) {
      const HARD = 3;
      const MEDIUM = 2;
      const EASY = 1;
      const TEN = 10;

      switch (difficulty) {
      case 'hard':
        playerScore = (TEN + (timer * HARD));
        break;
      case 'medium':
        playerScore = (TEN + (timer * MEDIUM));
        break;
      default:
        playerScore = (TEN + (timer * EASY));
      }

      setScore(playerScore);
    }
    const storage = JSON.parse(localStorage.getItem('state'));
    const stateObj = {
      player: {
        ...storage.player,
        assertions: verifyAnswer
          ? storage.player.assertions + 1 : storage.player.assertions,
        score: storage.player.score + playerScore,
      },
    };
    localStorage.setItem('state', JSON.stringify(stateObj));
  }

  answerMap() {
    const { answerArray, isClicked, resetTimer } = this.state;
    const verify = answerArray.length === 0;
    if (resetTimer) {
      this.setState({
        resetTimer: false,
      });
    }
    if (verify) {
      return this.createBtn();
    }
    if (!verify && isClicked) {
      return this.updateBtn();
    }
    return answerArray;
  }

  createBtn() {
    const { questions, index } = this.state;
    const {
      correct_answer: correctAnswer,
      incorrect_answers: incorrectAnswers,
    } = questions[index];
    const answers = [...incorrectAnswers, correctAnswer];
    const renderAnswers = answers.map((answer, i) => {
      const answerLength = answers.length - 1;
      const test = (i === answerLength) ? 'correct-answer' : `wrong-answer-${i}`;
      return (
        <button
          id={ test }
          type="button"
          data-testid={ test }
          key={ i }
          onClick={ this.handleClick }
        >
          { answer }
        </button>
      );
    });
    return this.randomArray(renderAnswers);
  }

  updateBtn() {
    const { answerArray } = this.state;
    const newAnswerArray = answerArray.map(({ props, key }) => {
      const verifyBtn = props.id.includes('correct');
      const btnClass = verifyBtn ? 'correct-answer' : `wrong-answer-${key}`;
      return (
        <button
          id={ btnClass }
          type="button"
          data-testid={ btnClass }
          key={ key }
          onClick={ this.handleClick }
          className={ btnClass }
          disabled
        >
          { props.children }
        </button>
      );
    });
    this.setState({
      answerArray: newAnswerArray,
      isClicked: false,
      nextBtn: true,
    });
    return newAnswerArray;
  }

  randomArray(array) {
    const ofive = 0.5;
    const newArrayAnswers = array.sort(() => Math.random() - ofive);
    this.setState({
      answerArray: newArrayAnswers,
    });
    return newArrayAnswers;
  }

  nextFuncBtn() {
    const { index } = this.state;
    const { history } = this.props;
    const quantPerguntas = 4;
    if (index === quantPerguntas) {
      history.push('/feedback');
    }
    this.setState({
      verifyAnswer: false,
      resetTimer: true,
      answerArray: [],
      index: index < quantPerguntas ? index + 1 : index,
      nextBtn: false,
    });
  }

  funcRenderButton() {
    return (
      <button
        type="button"
        data-testid="btn-next"
        onClick={ this.nextFuncBtn }
      >
        Próxima
      </button>
    );
  }

  renderFunction() {
    const { questions, index, isClicked, resetTimer, nextBtn } = this.state;
    const { category, question } = questions[index];
    return (
      <>
        <section>
          <h1 data-testid="question-category">
            { category }
          </h1>
          <p data-testid="question-text">
            { question }
          </p>
        </section>
        { this.answerMap().map((button) => button) }
        <Timer
          isClicked={ isClicked }
          updateBtn={ this.updateBtn }
          reset={ resetTimer }
        />
        { nextBtn && this.funcRenderButton() }
      </>
    );
  }

  render() {
    const { loading } = this.state;
    return (
      <div>
        <Header />
        { !loading && this.renderFunction() }
      </div>
    );
  }
}

const mapStateToProps = ({ playerReducer }) => ({
  timer: playerReducer.timer,
});

const mapDispatchToProps = (dispatch) => ({
  setScore: (score) => dispatch(setScoreAction(score)),
});

Trivia.propTypes = {
  history: PropTypes.shape({ push: PropTypes.func.isRequired }).isRequired,
  timer: PropTypes.number.isRequired,
  setScore: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(Trivia);
