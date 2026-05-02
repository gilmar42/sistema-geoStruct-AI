import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment, OrthographicCamera, PerspectiveCamera, Edges, ContactShadows, Html } from '@react-three/drei';

function SceneContents({ components }: { components: React.ReactNode[] }) {
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight 
        position={[20, 40, 20]} 
        intensity={3.5} 
        color="#FFFFFF" 
        castShadow 
        shadow-mapSize={[4096, 4096]} 
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />
      <pointLight position={[-15, 15, -15]} intensity={1.5} color="#38BDF8" distance={50} />
      <pointLight position={[15, 5, 15]} intensity={0.8} color="#FDE68A" distance={50} />
      
      <ContactShadows position={[0, -0.49, 0]} opacity={0.85} scale={60} blur={1.5} far={15} resolution={1024} color="#000000" />
      
      <Grid 
        renderOrder={-1} 
        position={[0, -0.51, 0]} 
        infiniteGrid 
        cellSize={1} 
        cellThickness={0.5} 
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#475569" 
        cellColor="#1E293B" 
      />
      
      {components}
      <Environment preset="city" background={false} />
    </>
  );
}

export default function ParametricViewer({ ast }: { ast: Record<string, unknown> | null }) {
  const { meshes: components, maxDim } = useMemo(() => {
    const meshes: React.ReactNode[] = [];
    if (!ast) return { meshes, maxDim: 25 };

    let projWidth = 20;
    let projLength = 30;
    let projHeight = 6;
    let projType = 'galpao';

    // O prop 'ast' passado pelo page.tsx JÁ É o componente_raiz
    if (ast) {
      if (typeof ast.tipo === 'string') projType = ast.tipo.toLowerCase();
      
      if (Array.isArray(ast.parametros)) {
        ast.parametros.forEach((p: Record<string, unknown>) => {
          if (typeof p.nome === 'string' && typeof p.valor === 'number') {
            const nome = p.nome.toLowerCase();
            if (nome.includes('largura') || nome.includes('dim_x') || nome.includes('diametro')) projWidth = p.valor;
            if (nome.includes('comprimento') || nome.includes('dim_z') || nome.includes('profundidade')) projLength = p.valor;
            if (nome.includes('altura') || nome.includes('direito') || nome.includes('dim_y')) projHeight = p.valor;
          }
        });
      }
    }

    const scale = 0.5;
    const w = projWidth * scale;
    const l = projLength * scale;
    const h = projHeight * scale;
    
    const maxDim = Math.max(w, l, 15); // Para escalar a câmera dinamicamente

    // Piso Base Comum
    meshes.push(
      <mesh position={[0, -0.25, 0]} key="root_base" receiveShadow>
        <boxGeometry args={[Math.max(w, l) + 5, 0.5, Math.max(w, l) + 5]} />
        <meshPhysicalMaterial color="#0F172A" metalness={0.9} roughness={0.4} clearcoat={0.2} />
        <Edges scale={1} threshold={15} color="#334155" />
      </mesh>
    );

    // ==========================================
    // PARSER UNIVERSAL (EQUIPAMENTOS INTERNOS)
    // Lê qualquer peça extra que a IA criou (ex: Ponte Rolante dentro do galpão)
    // ==========================================
    const subs = (ast.sub_componentes as Record<string, unknown>[]) || [];
    
    const getParam = (parametros: Record<string, unknown>[], names: string[], defaultVal: number) => {
      if (!Array.isArray(parametros)) return defaultVal;
      const p = parametros.find((p) => typeof p.nome === 'string' && names.some(n => p.nome === n));
      return p && typeof p.valor === 'number' ? p.valor : defaultVal;
    };

    subs.forEach((sub: Record<string, unknown>, index: number) => {
      const p = (sub.parametros as Record<string, unknown>[]) || [];
      const tipoStr = typeof sub.tipo === 'string' ? sub.tipo.toLowerCase() : '';
      
      // Ignoramos pilares/vigas bases aqui pois o gerador procedural de galpão já fará a estrutura,
      // a menos que não seja galpão. Vamos focar em desenhar equipamentos e pontes!
      if (projType.includes('galpao') || projType.includes('pavilhao')) {
        if (tipoStr.includes('pilar') || tipoStr.includes('viga') || tipoStr.includes('cobertura')) return;
      }

      const rawDx = getParam(p, ['dim_x', 'largura', 'diametro', 'vão'], 1);
      const rawDy = getParam(p, ['dim_y', 'altura', 'espessura'], 1);
      const rawDz = getParam(p, ['dim_z', 'profundidade', 'comprimento'], 1);
      
      const dx = rawDx * scale;
      const dy = rawDy * scale;
      const dz = rawDz * scale;
      
      const px = getParam(p, ['pos_x'], 0) * scale;
      const py = getParam(p, ['pos_y'], rawDy / 2) * scale;
      const pz = getParam(p, ['pos_z'], 0) * scale;

      const isCylinder = tipoStr.includes('tanque') || tipoStr.includes('tubo') || tipoStr.includes('eixo') || tipoStr.includes('motor');
      const isCrane = tipoStr.includes('ponte rolante') || tipoStr.includes('guincho');
      
      if (isCrane) {
        // Renderiza ponte rolante universal dentro do ambiente
        meshes.push(
          <group position={[px, py, pz]} key={`equip_${index}`}>
             <mesh castShadow>
               <boxGeometry args={[dx, 0.2, 0.3]} />
               <meshPhysicalMaterial color="#F59E0B" metalness={0.9} />
               <Edges color="#FDE68A" />
             </mesh>
             <mesh position={[0, -0.2, 0]} castShadow>
               <boxGeometry args={[0.4, 0.3, 0.4]} />
               <meshPhysicalMaterial color="#1E293B" metalness={0.5} />
               <Edges color="#94A3B8" />
             </mesh>
             <Html transform sprite position={[dx/2 + 2, 0, 0]} center className="pointer-events-none">
              <div className="bg-[#0F172A]/90 border border-[#F59E0B] px-2 py-1 rounded text-[#FDE68A] text-[10px] font-mono">
                {tipoStr} (Vão: {(dx/scale).toFixed(1)}m)
              </div>
            </Html>
          </group>
        );
      } else {
        // Bloquinhos para equipamentos aleatórios
        meshes.push(
          <mesh position={[px, py, pz]} key={`equip_${index}`} castShadow receiveShadow>
            {isCylinder ? <cylinderGeometry args={[dx/2, dx/2, dy, 32]} /> : <boxGeometry args={[dx, dy, dz]} />}
            <meshPhysicalMaterial color={isCylinder ? "#10B981" : "#8B5CF6"} metalness={0.7} roughness={0.3} />
            <Edges scale={1.001} color="#FFF" />
            <Html transform sprite position={[dx/2 + 1, dy/2, 0]} center className="pointer-events-none">
              <div className="bg-[#0F172A]/90 border border-[#8B5CF6] px-2 py-1 rounded text-[#DDD6FE] text-[10px] font-mono">
                {tipoStr}
              </div>
            </Html>
          </mesh>
        );
      }
    });

    // ==========================================
    // GERADORES PROCESSUAIS DE ALTA FIDELIDADE (CASCAS)
    // ==========================================
    if (projType.includes('tanque') || projType.includes('reservatorio') || projType.includes('silo')) {
      // DESENHO: TANQUE INDUSTRIAL
      const radius = w / 2;
      meshes.push(
        <group key="gerador_tanque">
          {/* Corpo Cilíndrico Principal */}
          <mesh position={[0, h/2, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[radius, radius, h, 32]} />
            <meshPhysicalMaterial color="#94A3B8" metalness={0.8} roughness={0.2} clearcoat={0.5} />
            <Edges scale={1.001} color="#E2E8F0" />
          </mesh>
          {/* Teto do Tanque (Cúpula) */}
          <mesh position={[0, h + (radius*0.2)/2, 0]} castShadow>
            <coneGeometry args={[radius + 0.2, radius*0.4, 32]} />
            <meshPhysicalMaterial color="#64748B" metalness={0.6} roughness={0.4} />
            <Edges scale={1.001} color="#94A3B8" />
          </mesh>
          {/* Escada de Acesso Espiralada */}
          {[...Array(Math.floor(h * 2))].map((_, i) => (
             <mesh position={[Math.cos(i) * (radius + 0.3), (i * 0.5), Math.sin(i) * (radius + 0.3)]} rotation={[0, -i, 0]} key={`escada_${i}`} castShadow>
               <boxGeometry args={[0.4, 0.02, 0.15]} />
               <meshPhysicalMaterial color="#F59E0B" metalness={0.9} roughness={0.1} />
             </mesh>
          ))}
          <Html transform sprite position={[radius + 4, h/2, 0]} center className="pointer-events-none">
            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-[#38BDF8] px-3 py-2 rounded-lg text-[#E0F2FE] text-[12px] font-mono shadow-2xl">
              ⚙️ Tanque Volumétrico<br/>Ø: {projWidth}m | Alt: {projHeight}m
            </div>
          </Html>
        </group>
      );
    } 
    else if (projType.includes('ponte') || projType.includes('esteira')) {
      // DESENHO: PONTE ROLANTE / PASSARELA
      meshes.push(
        <group key="gerador_ponte">
          {/* Pilares de Sustentação */}
          {[ -l/2, l/2 ].map((zPos, idx) => (
            <group key={`ponte_sup_${idx}`}>
              <mesh position={[-w/2, h/2, zPos]} castShadow receiveShadow>
                <boxGeometry args={[0.2, h, 0.3]} />
                <meshPhysicalMaterial color="#0284C7" metalness={0.8} roughness={0.2} />
                <Edges color="#BAE6FD" />
              </mesh>
              <mesh position={[w/2, h/2, zPos]} castShadow receiveShadow>
                <boxGeometry args={[0.2, h, 0.3]} />
                <meshPhysicalMaterial color="#0284C7" metalness={0.8} roughness={0.2} />
                <Edges color="#BAE6FD" />
              </mesh>
            </group>
          ))}
          {/* Vigas Longitudinais (Caminho de Rolamento) */}
          <mesh position={[-w/2, h, 0]} castShadow>
            <boxGeometry args={[0.2, 0.4, l + 0.5]} />
            <meshPhysicalMaterial color="#0369A1" metalness={0.7} />
            <Edges color="#38BDF8" />
          </mesh>
          <mesh position={[w/2, h, 0]} castShadow>
            <boxGeometry args={[0.2, 0.4, l + 0.5]} />
            <meshPhysicalMaterial color="#0369A1" metalness={0.7} />
            <Edges color="#38BDF8" />
          </mesh>
          {/* Viga Transversal (A Ponte em si) */}
          <mesh position={[0, h + 0.2, 0]} castShadow>
            <boxGeometry args={[w + 0.5, 0.3, 0.4]} />
            <meshPhysicalMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
            <Edges color="#FDE68A" />
          </mesh>
          {/* Carrinho / Guincho */}
          <mesh position={[w/4, h + 0.35, 0]} castShadow>
            <boxGeometry args={[0.5, 0.4, 0.6]} />
            <meshPhysicalMaterial color="#1E293B" metalness={0.5} />
            <Edges color="#94A3B8" />
          </mesh>
          <Html transform sprite position={[w/2 + 4, h/2, 0]} center className="pointer-events-none">
            <div className="bg-[#0F172A]/80 backdrop-blur-md border border-[#F59E0B] px-3 py-2 rounded-lg text-[#FDE68A] text-[12px] font-mono shadow-2xl">
              🏗️ Ponte Rolante (Vão: {projWidth}m)
            </div>
          </Html>
        </group>
      );
    }
    else if (projType.includes('caçamba') || projType.includes('cacamba') || projType.includes('carreta') || projType.includes('basculante')) {
      // DESENHO: EQUIPAMENTO RODOVIÁRIO (CAÇAMBA BASCULANTE)
      meshes.push(
        <group key="gerador_cacamba" position={[0, h/2 + 0.5, 0]} rotation={[0.2, 0, 0]}>
          {/* Assoalho da Caçamba (Chapa Inferior) */}
          <mesh position={[0, -h/2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, 0.05, l]} />
            <meshPhysicalMaterial color="#475569" metalness={0.8} roughness={0.6} />
            <Edges color="#94A3B8" />
          </mesh>
          {/* Tampa Lateral Esquerda */}
          <mesh position={[-w/2 + 0.025, 0, 0]} castShadow>
            <boxGeometry args={[0.05, h, l]} />
            <meshPhysicalMaterial color="#0284C7" metalness={0.8} roughness={0.3} />
            <Edges color="#38BDF8" />
          </mesh>
          {/* Tampa Lateral Direita */}
          <mesh position={[w/2 - 0.025, 0, 0]} castShadow>
            <boxGeometry args={[0.05, h, l]} />
            <meshPhysicalMaterial color="#0284C7" metalness={0.8} roughness={0.3} />
            <Edges color="#38BDF8" />
          </mesh>
          {/* Painel Frontal (Perto da Cabine) */}
          <mesh position={[0, 0, -l/2 + 0.025]} castShadow>
            <boxGeometry args={[w, h, 0.05]} />
            <meshPhysicalMaterial color="#0369A1" metalness={0.8} />
            <Edges color="#7DD3FC" />
          </mesh>
          {/* Tampa Traseira (Basculante) */}
          <mesh position={[0, 0, l/2 - 0.025]} rotation={[-0.1, 0, 0]} castShadow>
            <boxGeometry args={[w, h, 0.05]} />
            <meshPhysicalMaterial color="#F59E0B" metalness={0.9} roughness={0.2} />
            <Edges color="#FDE68A" />
          </mesh>
          
          {/* Reforços Laterais (Costelas) */}
          {[-l/4, 0, l/4].map((zPos, idx) => (
            <group key={`costela_${idx}`}>
              <mesh position={[-w/2, 0, zPos]}>
                <boxGeometry args={[0.08, h, 0.08]} />
                <meshPhysicalMaterial color="#0284C7" metalness={0.8} />
                <Edges color="#38BDF8" />
              </mesh>
              <mesh position={[w/2, 0, zPos]}>
                <boxGeometry args={[0.08, h, 0.08]} />
                <meshPhysicalMaterial color="#0284C7" metalness={0.8} />
                <Edges color="#38BDF8" />
              </mesh>
            </group>
          ))}

          {/* Anotação Mapeada Lateralmente */}
          <Html transform sprite position={[w/2 + 3, h/2, 0]} center className="pointer-events-none">
            <div className="bg-[#0F172A]/90 border border-[#F59E0B] px-2 py-1 rounded text-[#FDE68A] text-[10px] font-mono shadow-lg">
              Caçamba Basculante<br/>({projWidth}m x {projLength}m x {projHeight}m)
            </div>
          </Html>
        </group>
      );

      {/* Pistão Hidráulico Base (Fora da rotação da caçamba) */}
      meshes.push(
        <mesh position={[0, h/4, -l/4]} rotation={[-0.2, 0, 0]} key="pistao_base" castShadow>
          <cylinderGeometry args={[0.1, 0.1, h, 16]} />
          <meshPhysicalMaterial color="#1E293B" metalness={0.9} roughness={0.1} />
          <Edges color="#64748B" />
        </mesh>
      );
    }
    else if (projType.includes('galpao') || projType.includes('pavilhao')) {
      // DESENHO PADRÃO: GALPÃO INDUSTRIAL (O MAIS DETALHADO)
      const span = 5 * scale;
      const numPorticos = Math.max(2, Math.floor(l / span) + 1);
      
      meshes.push(
        <group key="gerador_galpao">
          {Array.from({ length: numPorticos }).map((_, i) => {
            const zPos = -l/2 + (i * (l / (numPorticos - 1)));
            return (
              <group key={`portico_${i}`}>
                {/* Pilares */}
                <mesh position={[-w/2, h/2, zPos]} castShadow receiveShadow>
                  <boxGeometry args={[0.15, h, 0.25]} />
                  <meshPhysicalMaterial color="#0284C7" metalness={0.8} />
                  <Edges color="#BAE6FD" />
                </mesh>
                <mesh position={[w/2, h/2, zPos]} castShadow receiveShadow>
                  <boxGeometry args={[0.15, h, 0.25]} />
                  <meshPhysicalMaterial color="#0284C7" metalness={0.8} />
                  <Edges color="#BAE6FD" />
                </mesh>
                {/* Tesoura do Telhado (Viga Inclinada) */}
                <mesh position={[-w/4, h + (w*0.1)/2, zPos]} rotation={[0, 0, 0.2]} castShadow>
                  <boxGeometry args={[w/2 + 0.1, 0.15, 0.1]} />
                  <meshPhysicalMaterial color="#0369A1" metalness={0.8} />
                  <Edges color="#7DD3FC" />
                </mesh>
                <mesh position={[w/4, h + (w*0.1)/2, zPos]} rotation={[0, 0, -0.2]} castShadow>
                  <boxGeometry args={[w/2 + 0.1, 0.15, 0.1]} />
                  <meshPhysicalMaterial color="#0369A1" metalness={0.8} />
                  <Edges color="#7DD3FC" />
                </mesh>
              </group>
            );
          })}
          
          {/* Terças de Cobertura (Vigas Longitudinais) */}
          {[-w/2, -w/4, 0, w/4, w/2].map((xPos, i) => {
            const yOffset = h + (Math.abs(xPos) === w/2 ? 0 : Math.abs(xPos) === w/4 ? w*0.05 : w*0.1);
            return (
              <mesh position={[xPos, yOffset + 0.08, 0]} key={`terca_${i}`} castShadow>
                <boxGeometry args={[0.05, 0.08, l]} />
                <meshPhysicalMaterial color="#1E293B" metalness={0.9} />
              </mesh>
            );
          })}

          {/* Telhado Translúcido em Duas Águas */}
          <mesh position={[-w/4, h + (w*0.1)/2 + 0.15, 0]} rotation={[0, 0, 0.2]} castShadow>
            <boxGeometry args={[w/2 + 0.4, 0.02, l + 0.5]} />
            <meshPhysicalMaterial color="#38BDF8" transparent opacity={0.3} metalness={0.1} />
            <Edges color="#0EA5E9" />
          </mesh>
          <mesh position={[w/4, h + (w*0.1)/2 + 0.15, 0]} rotation={[0, 0, -0.2]} castShadow>
            <boxGeometry args={[w/2 + 0.4, 0.02, l + 0.5]} />
            <meshPhysicalMaterial color="#38BDF8" transparent opacity={0.3} metalness={0.1} />
            <Edges color="#0EA5E9" />
          </mesh>

          <Html transform sprite position={[-w/2 - 4, h/4, 0]} center className="pointer-events-none">
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#38BDF8] px-4 py-1.5 rounded-lg text-[#E0F2FE] text-[14px] font-bold font-mono shadow-lg">
              ↔ Largura: {projWidth}m
            </div>
          </Html>
          <Html transform sprite position={[w/2 + 4, h/4, 0]} center className="pointer-events-none">
            <div className="bg-[#0F172A]/80 backdrop-blur-sm border border-[#38BDF8] px-4 py-1.5 rounded-lg text-[#E0F2FE] text-[14px] font-bold font-mono shadow-lg">
              ↕ Comp: {projLength}m
            </div>
          </Html>
        </group>
      );
    }

    return { meshes, maxDim };
  }, [ast]);

  return (
    <div className="w-full h-[600px] flex gap-4">
      <div className="flex-1 rounded-2xl overflow-hidden bg-[#0F172A] border border-[#1E293B] shadow-inner relative">
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-[#334155] rounded-lg px-3 py-1.5 text-xs font-mono text-[#94A3B8] shadow-lg">
            <span className="text-[#38BDF8] font-bold">Visão:</span> Perspectiva Dinâmica
          </div>
        </div>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }}>
          <PerspectiveCamera makeDefault position={[maxDim, maxDim * 0.8, maxDim * 1.4]} fov={45} />
          <Suspense fallback={null}>
            <color attach="background" args={['#0F172A']} />
            <SceneContents components={components} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.05} target={[0, 2, 0]} maxPolarAngle={Math.PI / 2 - 0.05} />
          </Suspense>
        </Canvas>
      </div>

      <div className="w-1/3 flex flex-col gap-4">
        <div className="flex-1 rounded-2xl overflow-hidden bg-[#0F172A] border border-[#1E293B] shadow-inner relative">
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-[#334155] rounded-md px-2 py-1 text-[10px] font-mono text-[#94A3B8]">
              Planta Baixa (Topo)
            </div>
          </div>
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }}>
            <OrthographicCamera makeDefault position={[0, 30, 0]} zoom={5} rotation={[-Math.PI / 2, 0, 0]} />
            <Suspense fallback={null}>
              <color attach="background" args={['#0B1120']} />
              <SceneContents components={components} />
            </Suspense>
          </Canvas>
        </div>

        <div className="flex-1 rounded-2xl overflow-hidden bg-[#0F172A] border border-[#1E293B] shadow-inner relative">
          <div className="absolute top-3 left-3 z-10">
            <div className="bg-[#1E293B]/80 backdrop-blur-sm border border-[#334155] rounded-md px-2 py-1 text-[10px] font-mono text-[#94A3B8]">
              Elevação (Frente)
            </div>
          </div>
          <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, powerPreference: "high-performance" }}>
            <OrthographicCamera makeDefault position={[0, 5, 30]} zoom={6} />
            <Suspense fallback={null}>
              <color attach="background" args={['#0B1120']} />
              <SceneContents components={components} />
            </Suspense>
          </Canvas>
        </div>
      </div>
    </div>
  );
}
