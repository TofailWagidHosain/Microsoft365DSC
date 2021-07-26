import { BaseButton, Button, DefaultButton, Panel, PanelType, PrimaryButton } from '@fluentui/react';
import Editor from '@monaco-editor/react';
import * as React from 'react';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { AuthenticationType } from '../../models/AuthenticationType';
import { authenticationTypeState } from '../../state/authenticationTypeState';
import { generatorPanelState } from '../../state/generatorPanelState';
import { selectedResourcesState } from '../../state/resourcesState';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './GeneratorPanel.module.css';

export interface IGeneratorPanelProps {
}

export const GeneratorPanel: React.FunctionComponent<IGeneratorPanelProps> = (props) => {
  const [isCopied, setIsCopied] = React.useState<boolean>(false);
  const authenticationType = useRecoilValue(authenticationTypeState);
  const [selectedResources] = useRecoilState(selectedResourcesState);
  const setGeneratorPanel = useSetRecoilState(generatorPanelState);

  const buttonStyles = { root: { marginRight: 8 } };

  const _dismissPanel = (ev?: any) => {
    setGeneratorPanel(false);
  };

  const _getScriptHeader = () => {
    let scriptHeader = "";
    scriptHeader += `# Generated by Microsoft365DSC from ${window.location.origin} on ${new Date().toLocaleString()}\n`;
    scriptHeader += `# Visit https://microsoft365dsc.com for more information\n`;
    return scriptHeader += "\n"
  }

  const _getScriptAuthentication = () => {
    let scriptAuthentication = "";

    switch(authenticationType) {
      case AuthenticationType.Credentials :
        scriptAuthentication =   ` -GlobalAdminAccount $creds`;
        break;
      case AuthenticationType.Application :
        scriptAuthentication =   ` -ApplicationId $ApplicationId -ApplicationSecret $ApplicationSecret -TenantId $TenantId`;
        break;
      case AuthenticationType.Certificate :
        scriptAuthentication =   ` -ApplicationId $ApplicationId -CertificateThumbprint $CertificateThumbprint -TenantId $TenantId`;
          break;
    }

    return scriptAuthentication;
  }

  const _getScriptPrompts = () => {
    let scriptPrompts = "";

    switch(authenticationType) {
      case AuthenticationType.Credentials :
        scriptPrompts =   `# Getting client credentials\n`;
        scriptPrompts +=  `$creds = Get-Credential\n`
        break;
      case AuthenticationType.Application :
        scriptPrompts =   `# Getting application information for Application + Secret authentication\n`;
        scriptPrompts +=  `$ApplicationId = Read-Host -Prompt 'Application Id'\n`
        scriptPrompts +=  `$ApplicationSecret = Read-Host -Prompt 'Application Secret'\n`
        scriptPrompts +=  `$TenantId = Read-Host -Prompt 'Tenant Id'\n`
        break;
      case AuthenticationType.Certificate :
          scriptPrompts =   `# Getting application information for Application + Certificate authentication\n`;
          scriptPrompts +=  `$ApplicationId = Read-Host -Prompt 'Application Id'\n`
          scriptPrompts +=  `$CertificateThumbprint = Read-Host -Prompt 'Certificate Thumbprint'\n`
          scriptPrompts +=  `$TenantId = Read-Host -Prompt 'Tenant Id'\n`
          break;
    }
    return scriptPrompts += "\n";
  }

  const _getScriptResources = () => {
    let resourcesToExport: string[] = selectedResources.filter((r) => r.checked === true).map((r) => r.name);
    let scriptResources = `# Exporting resources\nExport-M365DSCConfiguration -Quiet -ComponentsToExtract @("${resourcesToExport.join(
      '", "'
    )}")`;
    return scriptResources;
  }

  const _getExportScript = () => {
    let scriptHeader = _getScriptHeader();
    let scriptPrompts = _getScriptPrompts();
    let scriptResources = _getScriptResources();
    let scriptAuthentication = _getScriptAuthentication();

    return scriptHeader.concat(scriptPrompts, scriptResources, scriptAuthentication);
  };

  const _onRenderFooterContent = React.useCallback(
    () => (
      <div style={{display: 'flex'}}>
        <CopyToClipboard
          text={_getExportScript()}
          onCopy={(text, result) => { setIsCopied(result); }}>
          <PrimaryButton iconProps={{iconName: 'PasteAsCode'}} styles={buttonStyles} disabled={isCopied}>
            {isCopied ? "Copied!" : "Copy to clipboard"}
          </PrimaryButton>
        </CopyToClipboard>
        <DefaultButton onClick={_dismissPanel}>Cancel</DefaultButton>
      </div>
    ),
    [_dismissPanel],
  );

  return (
    <Panel
      isOpen={true}
      onDismiss={_dismissPanel}
      type={PanelType.large}
      closeButtonAriaLabel="Close"
      isBlocking={true}
      headerText="Export"
      styles={{content: {overflow: 'hidden', height: 'calc(100%)'}, scrollableContent: {overflow: 'hidden'}}}
      onRenderFooterContent={_onRenderFooterContent}
      isFooterAtBottom={true}
    >
      <Editor
        height="calc(100%)"
        defaultLanguage="powershell"
        theme="light"
        value={_getExportScript()}
        defaultValue={_getExportScript()}
        options={{ wordWrap: 'wordWrapColumn', wordWrapColumn: 120, readOnly: true, minimap: { enabled: false } }}
      />

    </Panel>
  );
};
