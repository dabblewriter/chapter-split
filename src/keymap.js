import { wrapIn, setBlockType, chainCommands, toggleMark, exitCode } from 'prosemirror-commands';
import { selectNextCell, selectPreviousCell } from 'prosemirror-schema-table';
import { wrapInList, splitListItem, liftListItem, sinkListItem } from 'prosemirror-schema-list';
import { undo, redo } from 'prosemirror-history';
import { undoInputRule } from 'prosemirror-inputrules';
import { Transform, ReplaceStep, canSplit } from 'prosemirror-transform';
import { Fragment, Slice } from 'prosemirror-model';
import { Selection } from 'prosemirror-state';

const mac = typeof navigator != "undefined" ? /Mac/.test(navigator.platform) : false;

export function buildKeymap(schema, mapKeys) {
  let keys = {}, type;
  function bind(key, cmd) {
    if (mapKeys) {
      let mapped = mapKeys[key];
      if (mapped === false) return;
      if (mapped) key = mapped;
    }
    keys[key] = cmd;
  }

  // Handle pressing Enter at the end of the title field
  bind("Enter", (state, dispatch, view) => {
    let { $from, $to } = state.selection;
    let atEnd = $to.parentOffset === $to.parent.content.size;
    if ($from.pos !== $to.pos || !atEnd || $to.parent.type.name !== 'title') return false;

    let $pos = state.doc.resolve($to.pos + 3);
    let selection = Selection.findFrom($pos);

    if (dispatch) {
      dispatch(state.tr.setSelection(selection).scrollIntoView());
    }
    return true;
  });

  bind("Mod-z", undo);
  bind("Shift-Mod-z", redo);
  bind("Backspace", undoInputRule);
  if (!mac) bind("Mod-y", redo);

  if (type = schema.marks.strong) {
    bind("Mod-b", toggleMark(type));
  }

  if (type = schema.marks.em){
    bind("Mod-i", toggleMark(type));
  }

  if (type = schema.marks.code) {
    bind("Mod-`", toggleMark(type));
  }

  if (type = schema.nodes.bullet_list) {
    bind("Shift-Ctrl-8", wrapInList(type));
  }

  if (type = schema.nodes.ordered_list) {
    bind("Shift-Ctrl-9", wrapInList(type));
  }

  if (type = schema.nodes.blockquote) {
    bind("Ctrl->", wrapIn(type));
  }

  function splitChapter(tr, pos, depth = 1, typesAfter) {
    let $pos = tr.doc.resolve(pos), before = Fragment.empty, after = Fragment.empty
    for (let d = $pos.depth, e = $pos.depth - depth, i = depth - 1; d > e; d--, i--) {
      before = Fragment.from($pos.node(d).copy(before))
      let typeAfter = typesAfter && typesAfter[i] && $pos.node(d)
      after = Fragment.from(typeAfter ? typeAfter.type.createAndFill(typeAfter.attrs, after) : $pos.node(d).copy(after))
    }
    return tr.step(new ReplaceStep(pos, pos, new Slice(before.append(after), depth, depth, true)))
  }

  if (schema.nodes.chapter) {
    let cmd = chainCommands(exitCode, (state, dispatch) => {
      let tr = state.tr;
      let $pos = tr.selection.$from;
      let pos = $pos.pos;

      if ($pos.node(-2).type.name === 'chapter') {
        splitChapter(tr.deleteSelection(), pos, 3, [ true ])
          .scrollIntoView()
        dispatch(tr);
        return true;
      }
    });

    bind("Mod-Enter", cmd);
  }

  if (type = schema.nodes.hard_break) {
    let br = type, cmd = chainCommands(exitCode, (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(br.create()).scrollIntoView());
      return true;
    });

    bind("Shift-Enter", cmd);
    if (mac) bind("Ctrl-Enter", cmd);
  }

  if (type = schema.nodes.list_item) {
    bind("Enter", splitListItem(type));
    bind("Mod-[", liftListItem(type));
    bind("Mod-]", sinkListItem(type));
  }

  if (type = schema.nodes.paragraph) {
    bind("Shift-Ctrl-0", setBlockType(type));
  }

  if (type = schema.nodes.code_block) {
    bind("Shift-Ctrl-\\", setBlockType(type));
  }

  if (type = schema.nodes.heading) {
    for (let i = 1; i <= 6; i++) {
      bind("Shift-Ctrl-" + i, setBlockType(type, {level: i}));
    }
  }

  if (type = schema.nodes.horizontal_rule) {
    let hr = type;
    bind("Mod-_", (state, dispatch) => {
      dispatch(state.tr.replaceSelectionWith(hr.create()).scrollIntoView());
      return true;
    });
  }

  if (schema.nodes.table_row) {
    bind("Tab", selectNextCell);
    bind("Shift-Tab", selectPreviousCell);
  }

  return keys;
}
