<template>
    <Lesson
        v-if="!lesson.type || lesson.type === 'text' || lesson.type === 'code'"
        :text="text"
        :concepts="concepts"
        :exercise="exercise"
        :validate="logic.validate"
        :code="logic.code"
        :solution="logic.solution"
        :overrideErrors="logic.options.overrideErrors"
        :createTestFile="logic.options.createTestFile"
        :createTestTree="logic.options.createTestTree"
        :lessonId="parseInt(lessonId, 10)"
        :lessonTitle="lesson.title"
    />
    <FileLesson
        v-else-if="lesson.type === 'file-upload'"
        :text="text"
        :concepts="concepts"
        :exercise="exercise"
        :validate="logic.validate"
        :code="logic.code"
        :solution="logic.solution"
        :overrideErrors="logic.options.overrideErrors"
        :createTestFile="logic.options.createTestFile"
        :createTestTree="logic.options.createTestTree"
        :lessonId="parseInt(lessonId, 10)"
        :lessonTitle="lesson.title"
    />
    <MultipleChoiceLesson
        v-else-if="lesson.type === 'multiple-choice'"
        :text="text"
        :concepts="concepts"
        :question="logic.question"
        :choices="logic.choices"
        :overrideErrors="logic.options.overrideErrors"
        :createTestFile="logic.options.createTestFile"
        :createTestTree="logic.options.createTestTree"
        :lessonId="parseInt(lessonId, 10)"
        :lessonTitle="lesson.title"
    />
</template>

<script>
import router from '../router'
import debug from '../utils/debug'
import { getTutorialByUrl } from '../utils/tutorials'
import marked from '../utils/marked'
import Lesson from '../components/Lesson.vue'
import FileLesson from '../components/FileLesson.vue'
import MultipleChoiceLesson from '../components/MultipleChoiceLesson.vue'

export default {
  components: {
    Lesson,
    FileLesson,
    MultipleChoiceLesson
  },
  props: {
    tutorialUrl: String,
    lessonId: String
  },
  methods: {
    loadFile: function (file, { failOnNotFound = true } = {}) {
      const tutorial = getTutorialByUrl(this.tutorialUrl)
      let filename
      let fileData

      switch (file) {
        case 'concepts':
          filename = `${this.lessonId}-concepts.md`
          break
        case 'exercise':
          filename = `${this.lessonId}-exercise.md`
          break
        case 'js':
          filename = `${this.lessonId}.js`
          break
        case 'md':
        default:
          filename = `${this.lessonId}.md`
      }

      try {
        fileData = require(`../tutorials/${tutorial.formattedId}-${tutorial.url}/${filename}`)
      } catch (error) {
        const errorMessage = `File "${filename}" not found`

        if (failOnNotFound) {
          console.error(errorMessage)
          console.error(error)
        } else if (debug) {
          // Only log in debug mode since not all files are mandatory
          console.warn(errorMessage)
        }

        // If no markdown file for the lesson was found, then lesson does not exist
        // redirect to 404 page
        if (file === 'md') {
          router.replace({ name: '404' })
        }

        if (failOnNotFound) {
          throw error
        }
      }

      return fileData
    }
  },
  computed: {
    textFileData: function () {
      return marked(this.loadFile('md'))
    },
    lesson: function () {
      return this.textFileData.meta
    },
    lessonNeedsJsFile: function () {
      return !!this.lesson.type && this.lesson.type !== 'text'
    },
    text: function () {
      return this.textFileData.html
    },
    concepts: function () {
      const concepts = this.loadFile('concepts', { failOnNotFound: false })

      return concepts ? marked(concepts).html : ''
    },
    exercise: function () {
      const exercise = this.lessonNeedsJsFile && this.loadFile('exercise')

      return exercise ? marked(exercise).html : ''
    },
    logic: function () {
      let logic = {
        options: {
          overrideErrors: false,
          createTestFile: false,
          createTestTree: false
        }
      }

      if (!this.lessonNeedsJsFile) {
        return logic
      }

      let fileLogic = this.loadFile('js')

      logic = {
        ...logic,
        ...fileLogic.default,
        options: {
          ...logic.options,
          ...fileLogic.default.options
        }
      }

      if (this.lesson.type === 'code') {
        if (!logic.validate) {
          console.warn(`No "validate" function found. Please export a "validate" function from the JavaScript file.`)
        }

        if (!logic.code) {
          console.warn(`No "code" String found. Please export a "code" String from the JavaScript file.`)
        }

        if (!logic.solution) {
          console.warn(`No "solution" String found. Please export a "solution" String from the JavaScript file.`)
        }
      }

      return logic
    }
  }
}
</script>
