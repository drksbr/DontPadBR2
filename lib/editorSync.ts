import * as Y from "yjs";

/**
 * Extrai texto simples de um Y.XmlFragment do BlockNote
 * Percorre recursivamente os elementos e extrai o texto
 */
export function extractTextFromXmlFragment(fragment: Y.XmlFragment): string {
  const lines: string[] = [];

  for (let i = 0; i < fragment.length; i++) {
    const item = fragment.get(i);
    const text = extractTextFromXmlElement(item);
    if (text !== null && text.length > 0) {
      lines.push(text);
    }
  }

  return lines.join("\n");
}

/**
 * Extrai texto de um elemento XML recursivamente
 */
function extractTextFromXmlElement(item: any): string | null {
  if (item instanceof Y.XmlText) {
    return item.toString();
  }

  if (item instanceof Y.XmlElement) {
    const parts: string[] = [];

    for (let i = 0; i < item.length; i++) {
      const child = item.get(i);
      const text = extractTextFromXmlElement(child);
      if (text !== null) {
        parts.push(text);
      }
    }

    return parts.join("");
  }

  return null;
}

/**
 * Converte texto simples para estrutura do BlockNote (Y.XmlFragment)
 * Cada linha vira um parágrafo
 *
 * BlockNote structure (baseado no snapshot oficial):
 * - blockgroup (root wrapper)
 *   - blockcontainer (id)
 *     - paragraph (backgroundColor, textAlignment, textColor)
 *       - texto direto
 */
export function textToXmlFragment(
  text: string,
  fragment: Y.XmlFragment,
  doc: Y.Doc
): void {
  // Divide o texto em linhas
  const lines = text ? text.split("\n") : [""];

  doc.transact(() => {
    // Limpa o fragmento existente
    while (fragment.length > 0) {
      fragment.delete(0, 1);
    }

    // Cria o blockgroup wrapper e insere PRIMEIRO no fragment
    const blockGroup = new Y.XmlElement("blockgroup");
    fragment.insert(0, [blockGroup]);

    // Agora que blockGroup está no documento, podemos construir dentro dele
    lines.forEach((line, index) => {
      const blockContainer = new Y.XmlElement("blockcontainer");
      blockContainer.setAttribute("id", generateBlockId());

      const paragraph = new Y.XmlElement("paragraph");
      paragraph.setAttribute("backgroundColor", "default");
      paragraph.setAttribute("textAlignment", "left");
      paragraph.setAttribute("textColor", "default");

      // Insere blockContainer no blockGroup primeiro
      blockGroup.insert(index, [blockContainer]);

      // Depois insere paragraph no blockContainer
      blockContainer.insert(0, [paragraph]);

      // Por fim, insere o texto no paragraph
      const textNode = new Y.XmlText();
      paragraph.insert(0, [textNode]);
      textNode.insert(0, line);
    });
  });
}

/**
 * Gera um ID único para blocos do BlockNote
 */
function generateBlockId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Sincroniza o conteúdo do XmlFragment para Y.Text
 * Usado quando troca do BlockNote para CodeMirror
 */
export function syncXmlFragmentToText(
  fragment: Y.XmlFragment,
  yText: Y.Text,
  doc: Y.Doc
): void {
  const text = extractTextFromXmlFragment(fragment);

  doc.transact(() => {
    // Limpa o Y.Text existente
    if (yText.length > 0) {
      yText.delete(0, yText.length);
    }
    // Insere o novo texto
    yText.insert(0, text);
  });
}

/**
 * Sincroniza o conteúdo do Y.Text para XmlFragment
 * Usado quando troca do CodeMirror para BlockNote
 */
export function syncTextToXmlFragment(
  yText: Y.Text,
  fragment: Y.XmlFragment,
  doc: Y.Doc
): void {
  const text = yText.toString();
  textToXmlFragment(text, fragment, doc);
}
