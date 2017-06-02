import { Schema } from 'prosemirror-model'
import { EditorView } from 'prosemirror-view'
import { EditorState } from 'prosemirror-state'
import { schema as basicSchema } from 'prosemirror-schema-basic'
import { setup } from './setup'


const title = {
  content: "text*",
  defining: true,
  parseDOM: [{ tag: 'h1.title' }],
  toDOM(node) {
    return [ 'h1', { class: 'title' }, 0 ]
  }
}

const chapter = {
  content: 'title scene+',
  parseDOM: [
    { tag: 'div.chapter' }
  ],
  toDOM() {
    return [ 'div', { class: 'chapter' }, 0 ]
  }
}

const scene = {
  content: 'paragraph+',
  parseDOM: [{ tag: 'div.scene' }],
  toDOM() {
    return [ 'div', { class: 'scene' }, 0 ]
  }
}


const schema = new Schema({
  nodes: basicSchema.spec.nodes
    .addBefore('heading', 'title', title)
    .addToEnd('chapter', chapter)
    .addToEnd('scene', scene)
    .update('doc', {
      content: 'chapter+'
    }),
  marks: basicSchema.spec.marks
})


function updateEmptyClass(node) {
  if (node.content.size && node.attrs.class) {
    delete node.attrs.class;
  } else if (!node.content.size && !node.attrs.class) {
    node.attrs.class = 'empty';
  }
}


export function create(container) {
  return new EditorView(container, {
    state: EditorState.create({ schema: schema, plugins: setup({
      schema
    })})
  })
}
