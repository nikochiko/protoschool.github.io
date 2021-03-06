import marked from 'meta-marked'

import tutorials from '../static/tutorials.json'
import { deriveShortname } from './paths'
import projects from './projects'

// Preprocess the tutorials.json file with all the needed info
for (const tutorialId in tutorials) {
  tutorials[tutorialId].formattedId = tutorialId
  tutorials[tutorialId].id = parseInt(tutorialId, 10)
  tutorials[tutorialId].shortTitle = deriveShortname(tutorials[tutorialId].url)
  tutorials[tutorialId].lessons = getTutorialLessons(tutorials[tutorialId])
  tutorials[tutorialId].project = projects.get(tutorials[tutorialId].project)
}

// TODO Move this to a build script in the future to avoid heavy processing on the client.
// This will only become a problem when the number of tutorials and lessons increases
export function getTutorialLessons (tutorial, lessons = [], lessonNumber = 1) {
  const lessonFilePrefix = `${tutorial.formattedId}-${tutorial.url}/${lessonNumber.toString().padStart(2, 0)}`

  let lessonMd
  let lesson

  try {
    lessonMd = require(`../tutorials/${lessonFilePrefix}.md`)
    lesson = {
      id: lessonNumber,
      formattedId: lessonNumber.toString().padStart(2, 0),
      ...marked(lessonMd).meta
    }
  } catch (error) {
    // lesson not found, we reached the end
    if (error.code === 'MODULE_NOT_FOUND') {
      return lessons
    }

    // data not well formatted
    if (error.name === 'YAMLException') {
      console.error(
        new Error(`Data improperly formatted in the lesson markdown file "${lessonFilePrefix}.md". Check that the YAML syntax is correct.`)
      )
    }
    throw error
  }

  if (lesson.type !== 'text') {
    try {
      lesson.logic = require(`../tutorials/${lessonFilePrefix}.js`).default
    } catch (error) {
      if (error.code === 'MODULE_NOT_FOUND') {
        console.error(
          new Error(`You are missing the file "${lessonFilePrefix}.js" required for lessons of type ${lesson.type}.`)
        )
      }
      throw error
    }
  }
  lessons.push(lesson)
  return getTutorialLessons(tutorial, lessons, lessonNumber + 1)
}

// SAMPLE LESSON OBJECT
// {
//   id: 1,
//   formattedId: "01",
//   title: "Data structures",
//   type: "text"
// }

// returns lesson object
export function getLesson (tutorialId, lessonId) {
  let lesson

  if (!lessonId) {
    lesson = {
      title: 'Resources',
      type: 'resources'
    }
  } else {
    // get lesson object from tutorials.json
    lesson = tutorials[tutorialId].lessons[(parseInt(lessonId, 10) - 1)]
  }

  // add more useful properties to it // BUT MAKE SURE THEY WORK FOR RESOURCES PAGE
  // lesson.path = `/${getTutorial(route).url}/${route.props.default.lessonId}`
  return lesson
}

// returns URL for tutorial's landing page
export function getTutorialFullUrl (tutorialId) {
  return `${window.location.origin}/#/${tutorials[tutorialId].url}`
}

// returns boolean - true if user has passed all lessons in the tutorial
export function isTutorialPassed (tutorial) {
  return !!localStorage[`passed/${tutorial.url}`]
}

// returns string representing tutorial type
export function getTutorialType (tutorialId) {
  if (tutorials[tutorialId].lessons.some(lesson => lesson.type === 'file-upload')) {
    return 'file-upload'
  } else if (tutorials[tutorialId].lessons.some(lesson => lesson.type === 'code')) {
    return 'code'
  } else if (tutorials[tutorialId].lessons.some(lesson => lesson.type === 'multiple-choice')) {
    return 'multiple-choice'
  } else {
    return 'text'
  }
}

// returns string representing lesson type
export function getLessonType (tutorialId, lessonId) {
  if (lessonId === 'resources') {
    return 'resources'
  }
  return getLesson(tutorialId, lessonId).type
}

export function getTutorialByUrl (tutorialUrl) {
  return Object.values(tutorials).find(({ url }) => url === tutorialUrl)
}

// Get all redirects for each tutorial through the `redirects` attribute
export function getRedirects () {
  return Object.values(tutorials).reduce((redirects, tutorial) => {
    if (tutorial.redirectUrls) {
      redirects = redirects.concat(
        ...tutorial.redirectUrls.map(redirect => [
          {
            path: `/${redirect}`,
            redirect: `/${tutorial.url}`
          }, {
            path: `/${redirect}/resources`,
            redirect: `/${tutorial.url}/resources`
          }, {
            path: `/${redirect}/:lessonId`,
            redirect: `/${tutorial.url}/:lessonId`
          }
        ])
      )
    }

    return redirects
  }, [])
}

export default tutorials
