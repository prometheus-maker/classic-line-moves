import { Plugin } from "obsidian";
import { apply, docLines, lineRange } from "./editor-ops";
import { indent, moveDown, moveUp, outdent } from "./logic";

export default class ClassicLineMoves extends Plugin {
	async onload() {
		this.addCommand({
			id: "move-line-up",
			name: "Move line up (plain, ignores list structure)",
			editorCallback: (editor) => {
				const doc = docLines(editor);
				const [a, b] = lineRange(editor);
				apply(editor, doc, moveUp(doc, a, b), -1);
			},
		});
		this.addCommand({
			id: "move-line-down",
			name: "Move line down (plain, ignores list structure)",
			editorCallback: (editor) => {
				const doc = docLines(editor);
				const [a, b] = lineRange(editor);
				apply(editor, doc, moveDown(doc, a, b), 1);
			},
		});
		this.addCommand({
			id: "indent-line-only",
			name: "Indent this line only (children stay)",
			editorCallback: (editor) => {
				const doc = docLines(editor);
				const [a, b] = lineRange(editor);
				apply(editor, doc, indent(doc, a, b, this.indentUnit()), 0);
			},
		});
		this.addCommand({
			id: "outdent-line-only",
			name: "Outdent this line only (children stay)",
			editorCallback: (editor) => {
				const doc = docLines(editor);
				const [a, b] = lineRange(editor);
				apply(editor, doc, outdent(doc, a, b, this.tabSize()), 0);
			},
		});
	}

	/** The editor's own indent settings (Settings > Editor > Indent using tabs / Tab indent size). */
	private config(key: string): unknown {
		// getConfig is not in the public typings, but is how the editor's own settings are read
		const vault = this.app.vault as unknown as { getConfig?: (k: string) => unknown };
		return vault.getConfig ? vault.getConfig(key) : undefined;
	}

	private tabSize(): number {
		const n = Number(this.config("tabSize"));
		return Number.isFinite(n) && n > 0 ? n : 4;
	}

	private indentUnit(): string {
		return this.config("useTab") === false ? " ".repeat(this.tabSize()) : "\t";
	}
}
