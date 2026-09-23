import { Proveedor } from '../../types';

/**
 * Nodo para el Árbol de Búsqueda (Trie)
 */
export class TrieNode {
  children: Map<string, TrieNode> = new Map();
  proveedorIds: Set<string> = new Set();
}

/**
 * Árbol de Búsqueda por Prefijos y Tokens (Trie Search Tree)
 * Indexa ultra-rápido los 5 campos del proveedor:
 * 1. Nombre o Razón Social
 * 2. RUC / Cédula
 * 3. Teléfono
 * 4. Nombre de Contacto
 * 5. Número de Cuenta Bancaria
 */
export class ProveedorSearchTrie {
  private root: TrieNode = new TrieNode();
  private proveedoresMap: Map<string, Proveedor> = new Map();

  private normalize(str: string): string {
    return (str || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  public build(proveedores: Proveedor[]) {
    this.root = new TrieNode();
    this.proveedoresMap.clear();

    for (const prov of proveedores) {
      this.proveedoresMap.set(prov.id, prov);

      const fields = [
        prov.nombre_o_razon_social,
        prov.ruc_cedula || '',
        prov.telefono || '',
        prov.nombre_contacto || '',
        prov.numero_cuenta || '',
      ];

      for (const field of fields) {
        if (!field) continue;
        const norm = this.normalize(field);
        if (!norm) continue;

        // Indexa la frase completa
        this.insertWord(norm, prov.id);

        // Indexa cada palabra o token por separado
        const tokens = norm.split(/[\s,.\-_/\\]+/).filter(Boolean);
        for (const token of tokens) {
          this.insertWord(token, prov.id);
        }
      }
    }
  }

  private insertWord(word: string, id: string) {
    let curr = this.root;
    curr.proveedorIds.add(id);

    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children.has(ch)) {
        curr.children.set(ch, new TrieNode());
      }
      curr = curr.children.get(ch)!;
      curr.proveedorIds.add(id);
    }
  }

  public search(query: string): Proveedor[] {
    const norm = this.normalize(query);
    if (!norm) {
      return Array.from(this.proveedoresMap.values());
    }

    const tokens = norm.split(/[\s,.\-_/\\]+/).filter(Boolean);
    if (tokens.length === 0) {
      return Array.from(this.proveedoresMap.values());
    }

    let resultIds: Set<string> | null = null;

    for (const token of tokens) {
      let curr: TrieNode | undefined = this.root;
      for (let i = 0; i < token.length; i++) {
        const ch = token[i];
        if (!curr || !curr.children.has(ch)) {
          curr = undefined;
          break;
        }
        curr = curr.children.get(ch);
      }

      const currentIds: Set<string> = curr ? curr.proveedorIds : new Set<string>();
      if (resultIds === null) {
        resultIds = new Set(currentIds);
      } else {
        const filtered: string[] = Array.from(resultIds).filter((id: string) => currentIds.has(id));
        resultIds = new Set(filtered);
      }

      if (resultIds.size === 0) break;
    }

    if (!resultIds || resultIds.size === 0) return [];

    return Array.from(resultIds)
      .map((id) => this.proveedoresMap.get(id)!)
      .filter(Boolean);
  }
}
