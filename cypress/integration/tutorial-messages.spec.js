import moment from 'moment'

describe(`DISPLAY TUTORIAL MESSAGES`, function () {
  const mockTutorial = {
    formattedId: '0001',
    id: 1,
    url: 'data-structures',
    redirectUrls: [],
    project: 'ipfs',
    title: 'Decentralized Data Structures',
    description: 'The decentralized web relies on unique data structures and linking strategies. Learn about the benefits of hashing, content addressing, DAG and Merkle Trees!',
    resources: [
      {
        title: 'Understanding How IPFS Deals with Files',
        link: 'https://youtu.be/Z5zNPwMDYGg',
        type: 'video',
        description: 'This course from IPFS Camp 2019 offers a deep exploration of how IPFS deals with files, including key concepts like immutability, content addressing, hashing, the anatomy of CIDs, what the heck a Merkle DAG is, and how chunk size affects file imports.'
      }
    ],
    updateMessage: '',
    createdAt: '2019-01-01T00:00:00.000Z',
    updatedAt: '2019-01-01T00:00:00.000Z'
  }

  function visitTutorialsWithDates ({ createdAt, updatedAt, updateMessage, passedAt, lessons = [] }) {
    cy.visit('/#/tutorials', {
      onBeforeLoad (window) {
        window.__DATA__ = {
          tutorials: {
            [mockTutorial.formattedId]: {
              ...mockTutorial,
              createdAt: createdAt && createdAt.toISOString(),
              updatedAt: updatedAt && updatedAt.toISOString(),
              updateMessage
            }
          }
        }

        window.localStorage.clear()

        passedAt &&
          window.localStorage.setItem(
            `passed/${mockTutorial.url}`,
            passedAt === 'passed' ? passedAt : passedAt.toISOString()
          )

        lessons.forEach((lessonPassedAt, index) => {
          window.localStorage.setItem(
            `passed/${mockTutorial.url}/${(index + 1).toString().padStart(2, 0)}`,
            lessonPassedAt === 'passed' ? lessonPassedAt : lessonPassedAt.toISOString()
          )
        })
      }
    })
  }

  describe('new tutorial messages', () => {
    it(`should show new message for new tutorials published less than a month ago`, function () {
      const date = moment().add(-2, 'weeks')

      visitTutorialsWithDates({
        createdAt: date,
        updatedAt: date
      })

      cy.get('.tutorial-message--new')
      cy.get('.tutorial-message--updated').should('not.exist')
    })

    it(`should not show new message for recently published tutorials that have been finished before the tutorial messages feature`, function () {
      const date = moment().add(-2, 'weeks')

      visitTutorialsWithDates({
        createdAt: date,
        updatedAt: date,
        passedAt: 'passed'
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })

    it(`should not show new message for new tutorials published more than 1 month ago`, function () {
      const date = moment().add(-5, 'weeks')

      visitTutorialsWithDates({
        createdAt: date,
        updatedAt: date
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })

    it(`should not show new message for recently published tutorials that have been finished`, function () {
      const date = moment().add(-2, 'weeks')

      visitTutorialsWithDates({
        createdAt: date,
        updatedAt: date,
        passedAt: moment().add(-1, 'weeks')
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })

    it.only(`should not show new message for published tutorials more than a month ago that have been finished before the tutorial messages feature`, function () {
      const date = moment().add(-5, 'weeks')

      visitTutorialsWithDates({
        createdAt: date,
        updatedAt: date,
        passedAt: 'passed'
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })
  })

  describe('update tutorial messages', () => {
    it(`should show update message for finished tutorial before the tutorial messages feature`, () => {
      const createdAt = moment().add(-10, 'months')
      const updatedAt = moment().add(-2, 'weeks')

      visitTutorialsWithDates({
        createdAt,
        updatedAt,
        passedAt: 'passed',
        updateMessage: 'update'
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('exist')
      cy.get('.tutorial-message--updated .tutorial-message-text').should('exist')
    })

    it(`should show update message for finished tutorial`, () => {
      const createdAt = moment().add(-10, 'months')
      const updatedAt = moment().add(-2, 'weeks')
      const passedAt = moment().add(-3, 'weeks')

      visitTutorialsWithDates({
        createdAt,
        updatedAt,
        passedAt
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('exist')
      cy.get('.tutorial-message--updated .tutorial-message-text').should('not.exist')
    })
    it(`should show update message for unfinished tutorial if some lessons were passed before the update`, () => {
      const createdAt = moment().add(-10, 'months')
      const updatedAt = moment().add(-2, 'weeks')
      const lessons = [
        moment().add(-3, 'weeks'),
        moment().add(-1, 'weeks')
      ]

      visitTutorialsWithDates({
        createdAt,
        updatedAt,
        lessons
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('exist')
    })
    it(`should show update message for unfinished tutorial if some lessons were passed before the tutorial messages feature`, () => {
      const createdAt = moment().add(-10, 'months')
      const updatedAt = moment().add(-2, 'weeks')
      const lessons = [
        'passed',
        moment().add(-1, 'weeks')
      ]

      visitTutorialsWithDates({
        createdAt,
        updatedAt,
        lessons
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('exist')
    })
    it(`should not show update message for unfinished tutorial if all the lessons were passed after the update`, () => {
      const createdAt = moment().add(-10, 'months')
      const updatedAt = moment().add(-2, 'weeks')
      const lessons = [
        moment().add(-1, 'weeks'),
        moment().add(-1, 'days')
      ]

      visitTutorialsWithDates({
        createdAt,
        updatedAt,
        lessons
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })
    it(`should not show update message if no updates were published`, () => {
      const date = moment().add(-5, 'weeks')

      visitTutorialsWithDates({
        createdAt: date,
        updatedAt: date
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })
    it(`should not show update message if no lessons were finished`, () => {
      const createdAt = moment().add(-5, 'weeks')
      const updatedAt = moment().add(-1, 'weeks')

      visitTutorialsWithDates({
        createdAt,
        updatedAt,
        updateMessage: 'Tutorial Updates!'
      })

      cy.get('.tutorial-message--new').should('not.exist')
      cy.get('.tutorial-message--updated').should('not.exist')
    })
  })
})
