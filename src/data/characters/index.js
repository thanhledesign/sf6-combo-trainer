import ken from './ken.json';
import terry from './terry.json';
import chunli from './chunli.json';
import luke from './luke.json';
import cammy from './cammy.json';
import mai from './mai.json';
import ryu from './ryu.json';

export const characters = {
  ken,
  terry,
  chunli,
  luke,
  cammy,
  mai,
  ryu
};

export const characterList = [
  { id: 'ken', name: 'Ken Masters', file: ken },
  { id: 'terry', name: 'Terry Bogard', file: terry },
  { id: 'chunli', name: 'Chun-Li', file: chunli },
  { id: 'luke', name: 'Luke Sullivan', file: luke },
  { id: 'cammy', name: 'Cammy White', file: cammy },
  { id: 'mai', name: 'Mai Shiranui', file: mai },
  { id: 'ryu', name: 'Ryu', file: ryu }
];

export { ken, terry, chunli, luke, cammy, mai, ryu };

export default characters;