/**
 * NYC Property Data Service
 * Fetches property data from NYC Open Data APIs
 */

export interface PropertyData {
  // Identifiers
  address: string
  borough: string
  neighborhood: string
  zipCode: string
  bbl: string
  block: string
  lot: string

  // Building specs
  buildingArea: number
  lotArea: number
  lotFrontage: number
  lotDepth: number
  numFloors: number
  unitsResidential: number
  unitsTotal: number
  yearBuilt: number
  buildingClass: string

  // Zoning
  zoningDistrict: string
  residentialFar: number
  commercialFar: number
  builtFar: number
  airRights: number

  // Location
  latitude: number
  longitude: number

  // Scores (from Walk Score API)
  walkScore?: number
  transitScore?: number
  bikeScore?: number

  // Tax data
  taxClass?: string
  assessedValue?: number
  annualTaxes?: number

  // Census demographics
  medianIncome?: number
  medianAge?: number
  population?: number
  medianRent?: number

  // Raw data
  rawPluto?: Record<string, unknown>
}

const BOROUGH_CODES: Record<string, string> = {
  'manhattan': '1',
  'mn': '1',
  'bronx': '2',
  'bx': '2',
  'brooklyn': '3',
  'bk': '3',
  'queens': '4',
  'qn': '4',
  'staten island': '5',
  'si': '5',
}

const BOROUGH_NAMES: Record<string, string> = {
  '1': 'Manhattan',
  '2': 'Bronx',
  '3': 'Brooklyn',
  '4': 'Queens',
  '5': 'Staten Island',
}

/**
 * Parse borough from address or explicit borough name
 */
function parseBorough(input: string): string | null {
  const lower = input.toLowerCase()

  // Check explicit borough names
  for (const [key, code] of Object.entries(BOROUGH_CODES)) {
    if (lower.includes(key)) {
      return code
    }
  }

  // Check for "New York, NY" which usually means Manhattan
  if (lower.includes('new york, ny') || lower.includes('new york ny')) {
    return '1'
  }

  return null
}

/**
 * Fetch property data from NYC PLUTO API
 */
export async function fetchPLUTOData(address: string, borough?: string): Promise<PropertyData | null> {
  try {
    // Parse borough from address if not provided
    const boroughCode = borough
      ? BOROUGH_CODES[borough.toLowerCase()] || borough
      : parseBorough(address)

    if (!boroughCode) {
      console.warn('Could not determine borough from address:', address)
      // Try all boroughs
      for (const code of ['1', '2', '3', '4', '5']) {
        const result = await fetchFromPLUTO(address, code)
        if (result) return result
      }
      return null
    }

    return await fetchFromPLUTO(address, boroughCode)
  } catch (error) {
    console.error('Error fetching PLUTO data:', error)
    return null
  }
}

async function fetchFromPLUTO(address: string, boroughCode: string): Promise<PropertyData | null> {
  // Clean up address for search
  const cleanAddress = address
    .replace(/,.*$/, '') // Remove everything after comma
    .replace(/\s+(manhattan|brooklyn|queens|bronx|staten island)/i, '')
    .replace(/\s+(ny|new york)/i, '')
    .trim()
    .toUpperCase()

  const url = `https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=upper(address) like '%25${encodeURIComponent(cleanAddress)}%25' AND borough='${boroughCode}'&$limit=5`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`PLUTO API error: ${response.status}`)
  }

  const data = await response.json()

  if (!data || data.length === 0) {
    return null
  }

  const record = data[0]

  // Calculate air rights
  const maxFar = Math.max(
    parseFloat(record.residfar) || 0,
    parseFloat(record.commfar) || 0
  )
  const lotArea = parseFloat(record.lotarea) || 0
  const buildingArea = parseFloat(record.bldgarea) || 0
  const maxBuildable = maxFar * lotArea
  const airRights = Math.max(0, Math.round(maxBuildable - buildingArea))

  return {
    address: record.address || cleanAddress,
    borough: BOROUGH_NAMES[boroughCode] || boroughCode,
    neighborhood: record.cd ? `CD ${record.cd}` : '',
    zipCode: record.zipcode || '',
    bbl: record.bbl || '',
    block: record.block || '',
    lot: record.lot || '',

    buildingArea: parseInt(record.bldgarea) || 0,
    lotArea: parseInt(record.lotarea) || 0,
    lotFrontage: parseFloat(record.lotfront) || 0,
    lotDepth: parseFloat(record.lotdepth) || 0,
    numFloors: parseInt(record.numfloors) || 0,
    unitsResidential: parseInt(record.unitsres) || 0,
    unitsTotal: parseInt(record.unitstotal) || 0,
    yearBuilt: parseInt(record.yearbuilt) || 0,
    buildingClass: record.bldgclass || '',

    zoningDistrict: record.zonedist1 || '',
    residentialFar: parseFloat(record.residfar) || 0,
    commercialFar: parseFloat(record.commfar) || 0,
    builtFar: parseFloat(record.builtfar) || 0,
    airRights,

    latitude: parseFloat(record.latitude) || 0,
    longitude: parseFloat(record.longitude) || 0,

    rawPluto: record,
  }
}

/**
 * Fetch Walk Score data
 */
export async function fetchWalkScore(
  address: string,
  lat: number,
  lng: number,
  apiKey?: string
): Promise<{ walkScore?: number; transitScore?: number; bikeScore?: number }> {
  const key = apiKey || process.env.NEXT_PUBLIC_WALKSCORE_API_KEY
  if (!key) {
    console.warn('Walk Score API key not configured')
    return {}
  }

  try {
    // Note: Walk Score API requires CORS proxy in browser
    // This should be called from server-side API route
    const url = `https://api.walkscore.com/score?format=json&address=${encodeURIComponent(address)}&lat=${lat}&lon=${lng}&transit=1&bike=1&wsapikey=${key}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Walk Score API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      walkScore: data.walkscore,
      transitScore: data.transit?.score,
      bikeScore: data.bike?.score,
    }
  } catch (error) {
    console.error('Error fetching Walk Score:', error)
    return {}
  }
}

/**
 * Fetch Census demographics by ZIP code
 */
export async function fetchCensusData(
  zipCode: string,
  apiKey?: string
): Promise<{ medianIncome?: number; medianAge?: number; population?: number; medianRent?: number }> {
  const key = apiKey || process.env.NEXT_PUBLIC_CENSUS_API_KEY
  if (!key) {
    console.warn('Census API key not configured')
    return {}
  }

  try {
    // ACS 5-year estimates variables:
    // B19013_001E = Median Household Income
    // B01002_001E = Median Age
    // B01003_001E = Total Population
    // B25064_001E = Median Gross Rent
    const variables = 'B19013_001E,B01002_001E,B01003_001E,B25064_001E'
    const url = `https://api.census.gov/data/2022/acs/acs5?get=NAME,${variables}&for=zip%20code%20tabulation%20area:${zipCode}&key=${key}`

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Census API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.length < 2) {
      return {}
    }

    // First row is headers, second row is data
    const values = data[1]

    return {
      medianIncome: parseInt(values[1]) || undefined,
      medianAge: parseFloat(values[2]) || undefined,
      population: parseInt(values[3]) || undefined,
      medianRent: parseInt(values[4]) || undefined,
    }
  } catch (error) {
    console.error('Error fetching Census data:', error)
    return {}
  }
}

/**
 * Get Mapbox static map URL
 */
export function getMapImageUrl(
  lat: number,
  lng: number,
  options: {
    width?: number
    height?: number
    zoom?: number
    style?: 'light' | 'dark' | 'satellite'
    pinColor?: string
  } = {}
): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
  if (!token) {
    console.warn('Mapbox token not configured')
    return ''
  }

  const {
    width = 800,
    height = 600,
    zoom = 16,
    style = 'light',
    pinColor = '1e3a5f',
  } = options

  const styleMap = {
    light: 'mapbox/light-v11',
    dark: 'mapbox/dark-v11',
    satellite: 'mapbox/satellite-streets-v12',
  }

  return `https://api.mapbox.com/styles/v1/${styleMap[style]}/static/pin-l+${pinColor}(${lng},${lat})/${lng},${lat},${zoom}/${width}x${height}@2x?access_token=${token}`
}

/**
 * Fetch complete property data with all enrichments
 */
export async function fetchCompletePropertyData(
  address: string,
  borough?: string
): Promise<PropertyData | null> {
  // Get base PLUTO data
  const plutoData = await fetchPLUTOData(address, borough)

  if (!plutoData) {
    return null
  }

  // Enrich with Walk Score if we have coordinates
  if (plutoData.latitude && plutoData.longitude) {
    const walkScoreData = await fetchWalkScore(
      `${plutoData.address}, ${plutoData.borough}, NY`,
      plutoData.latitude,
      plutoData.longitude
    )
    Object.assign(plutoData, walkScoreData)
  }

  // Enrich with Census data if we have ZIP
  if (plutoData.zipCode) {
    const censusData = await fetchCensusData(plutoData.zipCode)
    Object.assign(plutoData, censusData)
  }

  return plutoData
}

/**
 * Extract NYC address from user message
 */
export function extractNYCAddress(message: string): { address: string; borough?: string } | null {
  // Pattern to match NYC addresses
  // e.g., "123 Main Street, Manhattan" or "456 Broadway, Brooklyn, NY"
  const patterns = [
    // With explicit borough
    /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|place|pl|way|drive|dr|lane|ln))[,\s]+(?:in\s+)?(manhattan|brooklyn|queens|bronx|staten island)/i,
    // With NYC/New York
    /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|place|pl|way|drive|dr|lane|ln))[,\s]+(?:new york|nyc|ny)/i,
    // Just an address with street type
    /(\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|place|pl|way|drive|dr|lane|ln))/i,
  ]

  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match) {
      const address = match[1].trim()
      const borough = match[2]?.toLowerCase()
      return { address, borough }
    }
  }

  return null
}

/**
 * Check if property is likely rent stabilized
 */
export function isLikelyRentStabilized(property: PropertyData): boolean {
  // Built before 1974
  const oldEnough = property.yearBuilt < 1974

  // 6+ units
  const enoughUnits = property.unitsTotal >= 6

  // Not a coop/condo (building class not starting with 'R')
  const notCoop = !property.buildingClass?.startsWith('R')

  return oldEnough && enoughUnits && notCoop
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

/**
 * Format number with commas
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
