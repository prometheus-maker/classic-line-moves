import type { Editor, EditorPosition } from "obsidian";
import type { LineEdit } from "./logic";

/** The lines a selection covers. A selection that ends at the very start of a line doesn't include that line. */
export function lineRange(editor: Editor): [number, number] {
	const from = editor.getCursor("from");
	const to = editor.getCursor("to");
	const last = to.line > from.line && to.ch === 0 ? to.line - 1 : to.line;
	return [from.line, last];
}

export function docLines(editor: Editor): string[] {
	const n = editor.lineCount();
	const out: string[] = [];
	for (let i = 0; i < n; i++) out.push(editor.getLine(i));
	return out;
}

/** Apply one edit as a single undo step and move the selection along with the text. */
export function apply(editor: Editor, doc: string[], edit: LineEdit | null, lineDelta: number): void {
	if (!edit) return;
	const anchor = editor.getCursor("anchor");
	const head = editor.getCursor("head");
	const [first] = lineRange(editor);
	const shift = (p: EditorPosition): EditorPosition => {
		const i = p.line - first;
		const col = i >= 0 && i < edit.colShift.length ? edit.colShift[i] : 0;
		return { line: p.line + lineDelta, ch: Math.max(0, p.ch + col) };
	};
	editor.transaction({
		changes: [{ from: { line: edit.from, ch: 0 }, to: { line: edit.to, ch: doc[edit.to].length }, text: edit.lines.join("\n") }],
		selection: { from: shift(anchor), to: shift(head) },
	});
}
