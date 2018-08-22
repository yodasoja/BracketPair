import * as vscode from "vscode";

// tslint:disable:max-classes-per-file

class ScopeDefinitions {
    public readonly open: string;
    public readonly close?: string;
    public readonly unlessParentTokenEndsWith?: string;
}

class UserLanguageDefinition {
    public readonly language: string;
    public readonly extends?: string;
    public readonly scopes?: ScopeDefinitions[];
}

class LanguageDefinition {
    public readonly language: string;
    public readonly scope: Map<string, ScopeDefinitions>

    constructor(language: string, scope: Map<string, ScopeDefinitions>) {
        this.language = language;
        this.scope = scope;
    }
}

export default class LanguageRule {
    private readonly extendedLanguages = new Map<string, LanguageDefinition>();
    private readonly baseLanguages = new Map<string, UserLanguageDefinition>();
    private readonly stackLookup = new Map<string, Set<LanguageAgnosticToken>>();

    constructor(uri: vscode.Uri) {
        const userLanguages =
            vscode.workspace.getConfiguration("bracketPairColorizer2", uri)
                .get("languages") as UserLanguageDefinition[];

        for (const userLanguage of userLanguages) {
            this.baseLanguages.set(userLanguage.language, userLanguage);
        }
    }

    public get(languageId: string) {
        const stackResult = this.stackLookup.get(languageId);
        if (stackResult) {
            return stackResult;
        }

        const baseLanguage = this.baseLanguages.get(languageId);

        if (baseLanguage) {
            const history = new Set<UserLanguageDefinition>();
            const scopesThisToBase = this.getAllScopes(baseLanguage, [], history);

            const scopeMap = new Map<string, ScopeDefinitions>();

            // Set base map first then let extended languages overwrite
            for (let i = scopesThisToBase.length; i-- > 0;) {
                for (const scope of scopesThisToBase[i]) {
                    scopeMap.set(scope.open, scope);
                }
            }

            const extendedLanguage = new LanguageDefinition(baseLanguage.language, scopeMap);

            this.extendedLanguages.set(extendedLanguage.language, extendedLanguage);

            const tokens = new Set<LanguageAgnosticToken>();
            for (const scope of scopeMap.values()) {
                tokens.add(new LanguageAgnosticToken(scope));
            }

            this.stackLookup.set(languageId, tokens);
            return tokens;
        }
        else {
            console.warn("No language definitions for " + languageId);
        }
    }

    private getAllScopes(
        userLanguageDefinition: UserLanguageDefinition,
        allScopeDefinitions: ScopeDefinitions[][],
        history: Set<UserLanguageDefinition>): ScopeDefinitions[][] {
        if (history.has(userLanguageDefinition)) {
            console.error("Cycle detected while parsing user languages: " +
                userLanguageDefinition.language + " => " +
                [...history.values()]);
            return allScopeDefinitions;
        }

        history.add(userLanguageDefinition);

        if (userLanguageDefinition.scopes) {
            allScopeDefinitions.push(userLanguageDefinition.scopes);
        }

        if (userLanguageDefinition.extends) {
            const parsedLanguage = this.extendedLanguages.get(userLanguageDefinition.extends);

            if (parsedLanguage) {
                allScopeDefinitions.push([...parsedLanguage.scope.values()]);
                return allScopeDefinitions;
            }

            const unParsedLanguage = this.baseLanguages.get(userLanguageDefinition.extends);
            if (unParsedLanguage) {
                this.getAllScopes(unParsedLanguage, allScopeDefinitions, history);
            }
            else {
                console.error("Could not find user defined language: " + userLanguageDefinition.extends);
            }
        }

        return allScopeDefinitions;
    }
}

export class LanguageAgnosticToken {
    public readonly commonToken: string;
    public readonly scope: ScopeDefinitions;
    constructor(scope: ScopeDefinitions) {
        this.scope = scope;

        if (scope.close) {
            const openSplit = scope.open.split(".");
            const closeSplit = scope.open.split(".");
            let i = 0;
            for (; i < openSplit.length; i++) {
                if (openSplit[i] !== closeSplit[i]) {
                    break;
                }
            }

            openSplit.splice(i);
            this.commonToken = openSplit.join("");
        }
        else {
            this.commonToken = scope.open;
        }
    }
}
