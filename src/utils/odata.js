/**
 * OData metadata (EDMX/CSDL) parsing utilities.
 * Supports OData v4 (and tolerates v3 structure).
 */

/**
 * Get elements by local name, ignoring XML namespace prefixes.
 * @param {Element} parent
 * @param {string} localName
 * @returns {Element[]}
 */
function childrenByLocalName(parent, localName) {
  return Array.from(parent.children).filter(
    (el) => el.localName === localName || el.tagName.split(':').pop() === localName
  )
}

function attr(el, name) {
  if (!el) return null
  return el.getAttribute(name)
}

/**
 * Parse OData $metadata XML.
 * @param {string} xmlText
 * @returns {{schemas: Schema[], entitySets: EntitySetInfo[], entityTypes: Map<string, EntityType>, enums: Map<string, EnumType>}}
 */
export function parseMetadata(xmlText) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'application/xml')

  const parseError = doc.querySelector('parsererror')
  if (parseError) {
    throw new Error('Invalid XML in $metadata response')
  }

  const schemas = Array.from(doc.getElementsByTagName('*')).filter(
    (el) => el.localName === 'Schema'
  )

  const entityTypes = new Map()
  const complexTypes = new Map()
  const enums = new Map()
  const schemaMap = {}

  for (const schema of schemas) {
    const namespace = attr(schema, 'Namespace')
    if (!namespace) continue
    schemaMap[namespace] = schema

    // Entity Types
    for (const et of childrenByLocalName(schema, 'EntityType')) {
      const name = attr(et, 'Name')
      const fullName = `${namespace}.${name}`
      const keyProps = new Set()

      const keyEl = childrenByLocalName(et, 'Key')[0]
      if (keyEl) {
        for (const ref of childrenByLocalName(keyEl, 'PropertyRef')) {
          keyProps.add(attr(ref, 'Name'))
        }
      }

      const properties = []
      const navProperties = []

      for (const prop of childrenByLocalName(et, 'Property')) {
        properties.push({
          name: attr(prop, 'Name'),
          type: attr(prop, 'Type') || 'Edm.String',
          nullable: attr(prop, 'Nullable') !== 'false',
          maxLength: attr(prop, 'MaxLength'),
          isKey: keyProps.has(attr(prop, 'Name')),
        })
      }

      for (const nav of childrenByLocalName(et, 'NavigationProperty')) {
        navProperties.push({
          name: attr(nav, 'Name'),
          type: attr(nav, 'Type') || '',
          partner: attr(nav, 'Partner'),
          containsTarget: attr(nav, 'ContainsTarget') === 'true',
        })
      }

      const baseType = attr(et, 'BaseType')
      const typeInfo = {
        name,
        fullName,
        namespace,
        properties,
        navProperties,
        keyProps: [...keyProps],
        baseType,
        isOpen: attr(et, 'OpenType') === 'true',
        abstract: attr(et, 'AbstractType') === 'true',
      }
      entityTypes.set(fullName, typeInfo)
    }

    // Complex Types
    for (const ct of childrenByLocalName(schema, 'ComplexType')) {
      const name = attr(ct, 'Name')
      const fullName = `${namespace}.${name}`
      const properties = []
      for (const prop of childrenByLocalName(ct, 'Property')) {
        properties.push({
          name: attr(prop, 'Name'),
          type: attr(prop, 'Type') || 'Edm.String',
          nullable: attr(prop, 'Nullable') !== 'false',
        })
      }
      complexTypes.set(fullName, { name, fullName, properties })
    }

    // Enum Types
    for (const en of childrenByLocalName(schema, 'Enum')) {
      const name = attr(en, 'Name')
      const fullName = `${namespace}.${name}`
      const members = []
      for (const member of childrenByLocalName(en, 'Member')) {
        members.push({
          name: attr(member, 'Name'),
          value: attr(member, 'Value'),
        })
      }
      enums.set(fullName, { name, fullName, members })
    }
  }

  // Resolve inheritance for entity types
  for (const type of entityTypes.values()) {
    if (type.baseType && entityTypes.has(type.baseType)) {
      const base = entityTypes.get(type.baseType)
      // Inherited properties come first
      const inherited = base.properties.map((p) => ({ ...p, inherited: true }))
      type.properties = [...inherited, ...type.properties]
      type.navProperties = [...base.navProperties, ...type.navProperties]
      type.keyProps = type.keyProps.length ? type.keyProps : base.keyProps
    }
  }

  // Collect entity sets from all entity containers
  const entitySets = []
  for (const schema of schemas) {
    const namespace = attr(schema, 'Namespace')
    for (const container of childrenByLocalName(schema, 'EntityContainer')) {
      for (const es of childrenByLocalName(container, 'EntitySet')) {
        const setName = attr(es, 'Name')
        const entityTypeRef = attr(es, 'EntityType')
        entitySets.push({
          name: setName,
          entityType: entityTypeRef,
          entityTypeName: entityTypeRef ? entityTypeRef.split('.').pop() : null,
          namespace,
        })
      }
    }
  }

  return { entitySets, entityTypes, complexTypes, enums }
}

/**
 * Given a full entity type name and parsed metadata, return merged property list.
 */
export function getEntityType(fullName, metadata) {
  if (!metadata || !fullName) return null
  return metadata.entityTypes.get(fullName) || null
}

/**
 * Determine if a type is a collection type.
 */
export function isCollectionType(type) {
  return type && type.startsWith('Collection(')
}

/**
 * Extract the element type from a Collection(...) type string.
 */
export function collectionElementType(type) {
  if (!type) return type
  const match = type.match(/^Collection\((.+)\)$/)
  return match ? match[1] : type
}

/**
 * Check if a property type is numeric.
 */
export function isNumericType(type) {
  const numericTypes = new Set([
    'Edm.Int16', 'Edm.Int32', 'Edm.Int64',
    'Edm.Byte', 'Edm.SByte', 'Edm.Single',
    'Edm.Double', 'Edm.Decimal',
  ])
  return numericTypes.has(type)
}

/**
 * Check if a property type is a string.
 */
export function isStringType(type) {
  return type === 'Edm.String' || type === 'Edm.Boolean'
}

/**
 * Check if a property type is a date/time type.
 */
export function isDateType(type) {
  const dateTypes = new Set([
    'Edm.Date', 'Edm.DateTimeOffset', 'Edm.TimeOfDay',
  ])
  return dateTypes.has(type)
}

/**
 * Check if a property type is a boolean.
 */
export function isBooleanType(type) {
  return type === 'Edm.Boolean'
}

/**
 * Check if a property type is a GUID.
 */
export function isGuidType(type) {
  return type === 'Edm.Guid'
}

/**
 * Format a value for use in an OData $filter expression.
 * Strings, dates, and GUIDs are quoted; numbers and booleans are not.
 * @param {string} value
 * @param {string} type - Edm type
 * @returns {string}
 */
export function formatFilterValue(value, type) {
  if (value === '' || value === null || value === undefined) return ''

  if (isBooleanType(type)) {
    return value === 'true' || value === true ? 'true' : 'false'
  }

  if (isNumericType(type)) {
    return String(value)
  }

  if (isGuidType(type)) {
    return `${value}`
  }

  if (isDateType(type)) {
    if (type === 'Edm.DateTimeOffset') {
      return `${value}`
    }
    return `${value}`
  }

  // String — escape single quotes
  return `'${String(value).replace(/'/g, "''")}'`
}

/**
 * Filter operators grouped by type.
 */
export const FILTER_OPERATORS = [
  { value: 'eq', label: 'equals', kind: 'binary', types: ['all'] },
  { value: 'ne', label: 'not equals', kind: 'binary', types: ['all'] },
  { value: 'gt', label: 'greater than', kind: 'binary', types: ['number', 'date', 'string'] },
  { value: 'ge', label: 'greater or equal', kind: 'binary', types: ['number', 'date', 'string'] },
  { value: 'lt', label: 'less than', kind: 'binary', types: ['number', 'date', 'string'] },
  { value: 'le', label: 'less or equal', kind: 'binary', types: ['number', 'date', 'string'] },
  { value: 'contains', label: 'contains', kind: 'func', types: ['string'] },
  { value: 'startswith', label: 'starts with', kind: 'func', types: ['string'] },
  { value: 'endswith', label: 'ends with', kind: 'func', types: ['string'] },
]

/**
 * Build a single filter condition string.
 * @param {{field, operator, value, type}} condition
 * @returns {string}
 */
export function buildCondition(condition) {
  if (!condition.field || !condition.operator) return ''
  const { field, operator, value, type = 'Edm.String' } = condition
  const op = FILTER_OPERATORS.find((o) => o.value === operator)
  if (!op) return ''

  if (op.kind === 'func') {
    const formatted = formatFilterValue(value, type)
    if (!formatted) return ''
    return `${operator}(${field}, ${formatted})`
  }

  const formatted = formatFilterValue(value, type)
  if (!formatted) return ''
  return `${field} ${operator} ${formatted}`
}

/**
 * Build the full $filter expression from an array of conditions.
 * @param {Array} conditions
 * @returns {string}
 */
export function buildFilterString(conditions) {
  if (!conditions || conditions.length === 0) return ''
  const parts = conditions
    .map(buildCondition)
    .filter(Boolean)
  if (parts.length === 0) return ''
  return parts.join(' and ')
}

/**
 * Pretty-print OData property type for display.
 */
export function prettyType(type) {
  if (!type) return ''
  return type.replace('Edm.', '').replace('Collection(', '[]')
}
