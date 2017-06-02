import { blockQuoteRule, orderedListRule, bulletListRule, codeBlockRule, headingRule,
       inputRules, allInputRules, InputRule } from 'prosemirror-inputrules'
import { history } from 'prosemirror-history'
import { keymap } from 'prosemirror-keymap'
import { baseKeymap } from 'prosemirror-commands'
import { Plugin } from 'prosemirror-state'
import { buildKeymap } from 'prosemirror-example-setup'
import { Decoration, DecorationSet } from 'prosemirror-view'



export function placeholders() {
  return new Plugin({
    props: {
      decorations(state) {
        let doc = state.doc
        let set = [];

        state.doc.content.descendants((node, pos) => {
          if (node.type.name === 'title' || node.type.name === 'scene') {
            if (node.type.name === 'scene') {
              pos += 1;
              node = node.content.content[0];
            }
            if (node.content.size === 0) {
              set.push(Decoration.node(pos, pos + node.nodeSize, { class: 'empty' }))
            }
            return true;
          }
        })
        return DecorationSet.create(doc, set)
      }
    }
  });
}


export function setup(options) {
  let plugins = [
    inputRules({ rules: allInputRules.concat(buildInputRules(options.schema)) }),
    keymap(buildKeymap(options.schema)),
    keymap(baseKeymap),
    history(),
    placeholders()
  ]

  return plugins
}


export function buildInputRules(schema) {
  let result = [], type
  if (type = schema.nodes.blockquote) result.push(blockQuoteRule(type))
  if (type = schema.nodes.ordered_list) result.push(orderedListRule(type))
  if (type = schema.nodes.bullet_list) result.push(bulletListRule(type))
  if (type = schema.nodes.code_block) result.push(codeBlockRule(type))
  if (type = schema.nodes.heading) result.push(headingRule(type, 6))
  if (type = schema.nodes.scene) result.push(splitRule(/^\*{3}$/, 1))
  if (type = schema.nodes.chapter) result.push(splitRule(/^={3}$/, 2))
  return result
}

function splitRule(match, depth) {
  return new InputRule(match, (state, match, start, end) => {
    let $start = state.doc.resolve(start - 1)
    let $end = state.doc.resolve(end + 1)
    let hasBefore = Boolean($start.nodeBefore)
    let hasAfter = Boolean($end.nodeAfter)

    // Ensure only new paragraphs that would be expected get created, and the cursor goes to the right place (the
    // empty block if one side is empty)
    if (hasBefore && hasAfter) {
      // Split a block without adding any paragraphs
      return state.tr
        .delete(start - 1, end + 1)
        .split(start - 1, depth)
    } else if (hasBefore) {
      // Add a block with a paragraph after
      return state.tr
        .delete(start, end)
        .split(start - 1, depth)
    } else if (hasAfter) {
      // Add a block with a paragraph before
      return state.tr
        .delete(start, end)
        .split(start + 1, depth)
    } else {
      return state.tr
        .delete(start, end)
        .split(start, depth + 1)
    }
  })
}
