import CollectionEditor from './collection-editor';
import * as HelpElements from './help-elements';
import withConfigurationPage from './configuration-page';
import ContentAutocomplete from './content-autocomplete';
import Dictionary from './dictionary';
import * as Content from './content';
import * as Modal from './modal';
import Confidence from './confidence';
import JsonEditor from './json-editor';
import TableFilters from './table-filters';
import UserAutocomplete from './user-autocomplete';
import SelectTransport from './select-transport';
import Panel from './grid-panel';
import * as WidgetForm from './widget-form';
import InputInteger from './input-integer';
import PageContainer from './page-container';
import ChatbotStatus from './chatbot-status';
import SmallTag from './small-tag';
import EditDevice from './edit-device';
import MarkdownViewer from './markdown-viewer';
import { UserRecords } from './user-records';
import Maps from './maps';
import Breadcrumbs from './breadcrumbs';
import CopyAndPasteButton from './copy-and-paste';
import SmartDate from './smart-date';
import Button from './button';
import GenericMessage from './generic-chat-message';
import GenericMessageGroup from './generic-message-group';
import EmptyCallToAction from './empty-call-to-action';
import Language from './language';
import LanguagePicker from './language-picker';
import * as Chat from './chat';
import confirm from './confirm';
import InputFloat from './input-float';
//import SelectActiveChatbots from './select-active-chatbots';

import { useNodeRedSocket } from '../hooks/socket';
import useMCContext from '../hooks/mc-context';

// Define the global scope to store the components shared with plugins
if (window.globalLibs == null) {
  window.globalLibs = {};
}
window.globalLibs.Components = {
  CollectionEditor,
  HelpElements,
  withConfigurationPage,
  ContentAutocomplete,
  Dictionary,
  Confidence,
  Content,
  JsonEditor,
  TableFilters,
  UserAutocomplete,
  SelectTransport,
  Modal,
  Panel,
  WidgetForm,
  InputInteger,
  PageContainer,
  ChatbotStatus,
  SmallTag,
  EditDevice,
  MarkdownViewer,
  UserRecords,
  Maps,
  Breadcrumbs,
  CopyAndPasteButton,
  SmartDate,
  Button,
  useNodeRedSocket,
  useMCContext,
  GenericMessage,
  GenericMessageGroup,
  EmptyCallToAction,
  Language,
  LanguagePicker,
  Chat,
  confirm,
  InputFloat
};

export {
  CollectionEditor,
  HelpElements,
  withConfigurationPage,
  ContentAutocomplete,
  Dictionary,
  Confidence,
  Content,
  JsonEditor,
  TableFilters,
  UserAutocomplete,
  SelectTransport,
  Modal,
  Panel,
  WidgetForm,
  InputInteger,
  PageContainer,
  ChatbotStatus,
  SmallTag,
  EditDevice,
  MarkdownViewer,
  UserRecords,
  Maps,
  Breadcrumbs,
  CopyAndPasteButton,
  SmartDate,
  Button,
  useNodeRedSocket,
  useMCContext,
  GenericMessage,
  GenericMessageGroup,
  EmptyCallToAction,
  Language,
  LanguagePicker,
  Chat,
  confirm,
  InputFloat
};
