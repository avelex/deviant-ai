import * as ts from 'typescript';
import * as vm from 'vm';
import * as fs from 'fs';

export class AgentExecutor {
    private context: vm.Context;
    private scriptInstance: any;

    constructor() {
        this.context = vm.createContext({
            console,
            Buffer,
            setTimeout,
            setInterval,
            process: { env: {} },
            exports: {}
        });
    }

    public async loadScript(filePath: string) {
        let code = fs.readFileSync(filePath, 'utf8');

        if (filePath.endsWith('.ts')) {
            console.log(`[Executor] Transpiling ${filePath}...`);
            const result = ts.transpileModule(code, {
                compilerOptions: { module: ts.ModuleKind.CommonJS }
            });
            code = result.outputText;
        }

        const script = new vm.Script(code);
        script.runInContext(this.context);

        this.scriptInstance = this.context.exports;
        
        if (typeof this.scriptInstance.get_move !== 'function') {
            throw new Error('get_move function not found in agent script');
        }
    }

    public getMove(fen: string): string {
        return this.scriptInstance.get_move(fen);
    }
}
