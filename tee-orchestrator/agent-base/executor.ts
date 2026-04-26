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
            exports: {},
            require: require // Pass global require to the sandbox
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
        // Add 5 second timeout for initial script execution
        script.runInContext(this.context, { timeout: 5000 });

        this.scriptInstance = this.context.exports;
        
        if (typeof this.scriptInstance.get_move !== 'function') {
            throw new Error('get_move function not found in agent script');
        }
    }

    public getMove(fen: string): string {
        // In a real environment we might want to wrap this in a timeout too, 
        // but vm.runInContext timeout only applies to the top-level execution.
        // For a more robust solution we'd need isolated-vm or a separate process.
        return this.scriptInstance.get_move(fen);
    }
}
