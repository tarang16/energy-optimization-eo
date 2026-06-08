const NETWORK_COLOUR_OPTIONS = {
  default: {
    bgColor: '#ffffff',
    borderColor: '#000000',
  },
  fuel: {
    bgColor: 'rgba(255, 0, 0, 0.5)',
    borderColor: 'red',
  },
  power: {
    bgColor: 'rgba(169, 169, 169, 0.5)',
    borderColor: 'gray',
  },
  hp: {
    bgColor: 'rgba(255, 165, 0, 0.5)',
    borderColor: 'orange',
  },
  mp: {
    bgColor: 'rgba(255, 205, 0, 0.5)',
    borderColor: 'rgb(255, 205, 0)',
  },
  lp: {
    bgColor: 'rgba(0, 0, 255, 0.5)',
    borderColor: 'blue',
  },
  water: {
    bgColor: 'rgba(154, 194, 246, 0.5)',
    borderColor: 'rgb(154, 194, 246)',
  },
  suspect: {
    bgColor: 'rgba(104, 52, 155, 0.5)',
    borderColor: 'rgb(104, 52, 155)',
  },
  clean: {
    bgColor: 'rgba(79, 113, 190, 0.5)',
    borderColor: 'rgb(79, 113, 190)',
  },
  vhp: {
    bgColor: 'rgba(255, 102, 0, 0.5)',
    borderColor: 'rgb(255, 102, 0, 0)',
  },
  air: {
    bgColor: 'rgba(153, 173, 170, 0.5)',
    borderColor: 'rgb(153, 173, 170)',
  },
  coolingWater: {
    bgColor: 'rgba(66, 197, 245, 0.5)',
    borderColor: 'rgb(66, 197, 245)',
  },
}
export const resources = [
  {
    name: 'Default',
    id: 'Default',
  },
  {
    name: 'Fuel',
    id: 'Fuel',
  },
  {
    name: 'VHP',
    id: 'VHP',
  },
  {
    name: 'Power',
    id: 'Power',
  },
  {
    name: 'HP Steam',
    id: 'HP Steam',
  },
  {
    name: 'MP Steam',
    id: 'MP Steam',
  },
  {
    name: 'LP Steam',
    id: 'LP Steam',
  },
  {
    name: 'Water',
    id: 'Water',
  },
  {
    name: 'Suspect Condensate',
    id: 'Suspect Condensate',
  },
  {
    name: 'Clean Condensate',
    id: 'Clean Condensate',
  },
  {
    name: 'Air',
    id: 'Air',
  },
  {
    name: 'Cooling Water',
    id: 'Cooling Water',
  },
]
export const text_box_resources = [
  ...resources,
  {
    name: 'Green',
    id: 'Green',
  },
  {
    name: 'Blue',
    id: 'Blue',
  },
]
export const edgeOptions = [
  {
    name: 'Default',
    id: 'flowingPipe',
    bgColor: '#000000',
  },
  {
    name: 'Fuel',
    id: 'flowingPipeFuel',
    bgColor: 'rgba(255, 0, 0, 0.7)',
    legendSortOrder: 1,
  },
  {
    name: 'Power',
    id: 'flowingPipePower',
    bgColor: 'rgba(169, 169, 169, 0.7)',
    legendSortOrder: 6,
  },
  {
    name: 'HP Steam',
    id: 'flowingPipeHp',
    bgColor: 'rgba(255, 165, 0, 0.7)',
    legendSortOrder: 2,
  },
  {
    name: 'MP Steam',
    id: 'flowingPipeMp',
    bgColor: 'rgba(255, 205, 0, 0.7)',
    legendSortOrder: 3,
  },
  {
    name: 'LP Steam',
    id: 'flowingPipeLp',
    bgColor: 'rgba(0, 0, 255, 0.7)',
    legendSortOrder: 8,
  },
  {
    name: 'Water',
    id: 'flowingPipeWater',
    bgColor: 'rgba(154, 194, 246, 0.8)',
    legendSortOrder: 7,
  },
  {
    name: 'Suspect Condensate',
    id: 'flowingPipSuspectCondensate',
    bgColor: 'rgba(104, 52, 155, 0.8)',
    legendSortOrder: 4,
  },
  {
    name: 'Clean Condensate',
    id: 'flowingPipeCleanCondensate',
    bgColor: 'rgba(79, 113, 190, 0.8)',
    legendSortOrder: 9,
  },
  {
    name: 'VHP',
    id: 'flowingPipeVhp',
    bgColor: 'rgba(255, 102, 0, 0.5)',
    legendSortOrder: 5,
  },
  {
    name: 'Air',
    id: 'flowingPipeAir',
    bgColor: 'rgba(153, 173, 170, 0.5)',
    legendSortOrder: 10,
  },
  {
    name: 'Cooling Water',
    id: 'flowingPipeCoolingWater',
    bgColor: 'rgba(66, 197, 245, 0.5)',
    legendSortOrder: 11,
  },
]
export const NODE_COLORS = {
  Default: NETWORK_COLOUR_OPTIONS.default,
  default: NETWORK_COLOUR_OPTIONS.default,
  Fuel: NETWORK_COLOUR_OPTIONS.fuel,
  Power: NETWORK_COLOUR_OPTIONS.power,
  'HP Steam': NETWORK_COLOUR_OPTIONS.hp,
  'LP Steam': NETWORK_COLOUR_OPTIONS.lp,
  'MP Steam': NETWORK_COLOUR_OPTIONS.mp,
  VHP: NETWORK_COLOUR_OPTIONS.vhp,
  Water: NETWORK_COLOUR_OPTIONS.water,
  'Suspect Condensate': NETWORK_COLOUR_OPTIONS.suspect,
  'Clean Condensate': NETWORK_COLOUR_OPTIONS.clean,
  Air: NETWORK_COLOUR_OPTIONS.air,
  'Cooling Water': NETWORK_COLOUR_OPTIONS.coolingWater,
}
export const EXTRA_NODE_COLORS = {
  ...NODE_COLORS,
  Green: {
    bgColor: 'rgba(181, 213, 167, 0.8)',
    borderColor: 'rgb(181, 213, 167)',
  },
  Blue: {
    bgColor: 'rgba(91, 155, 213, 0.8)',
    borderColor: 'rgb(91, 155, 213)',
  },
}
export const EDGE_COLORS = {
  flowingPipe: NETWORK_COLOUR_OPTIONS.default,
  flowingPipeFuel: NETWORK_COLOUR_OPTIONS.fuel,
  flowingPipePower: NETWORK_COLOUR_OPTIONS.power,
  flowingPipeHp: NETWORK_COLOUR_OPTIONS.hp,
  flowingPipeMp: NETWORK_COLOUR_OPTIONS.mp,
  flowingPipeLp: NETWORK_COLOUR_OPTIONS.lp,
  flowingPipeWater: NETWORK_COLOUR_OPTIONS.water,
  flowingPipSuspectCondensate: NETWORK_COLOUR_OPTIONS.suspect,
  flowingPipeCleanCondensate: NETWORK_COLOUR_OPTIONS.clean,
  flowingPipeVhp: NETWORK_COLOUR_OPTIONS.vhp,
  flowingPipeAir: NETWORK_COLOUR_OPTIONS.air,
  flowingPipeCoolingWater: NETWORK_COLOUR_OPTIONS.coolingWater,
}
