declare module '@svg-maps/india' {
  interface Location {
    id: string
    name: string
    path: string
  }
  const map: {
    label: string
    viewBox: string
    locations: Location[]
  }
  export default map
}