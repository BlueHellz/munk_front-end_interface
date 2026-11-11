import {useApp} from './state';
import {Dialog} from './components';
import {AppearanceChoices} from './Appearance';
export default function Designer(){const {setModal}=useApp();return <Dialog title="Appearance & add-ons" wide onClose={()=>setModal(null)}><AppearanceChoices installed/></Dialog>;}
