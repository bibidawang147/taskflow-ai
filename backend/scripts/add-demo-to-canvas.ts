import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found');
    return;
  }
  
  let layout = await prisma.workspaceLayout.findUnique({
    where: { userId: user.id }
  });
  
  let layoutData: any = {};
  
  if (layout && layout.layout) {
    try {
      layoutData = JSON.parse(String(layout.layout));
    } catch (e) {
      console.log('Error parsing existing layout, creating new one');
      layoutData = {};
    }
  }
  
  if (!layoutData.items) {
    layoutData.items = {
      'canvas-root': {
        id: 'canvas-root',
        type: 'container',
        name: '画布',
        parentId: '',
        position: { x: 0, y: 0 },
        size: { width: 2000, height: 1500 },
        collapsed: false,
        childrenIds: [],
        color: 'rgba(139, 92, 246, 0.15)'
      }
    };
  }
  
  const cardId = 'workflow-demo-001-' + Date.now();
  layoutData.items[cardId] = {
    id: cardId,
    type: 'workflow',
    workflowId: 'demo-workflow-001',
    parentId: 'canvas-root',
    position: { x: 50, y: 50 }
  };
  
  if (layoutData.items['canvas-root']) {
    if (!layoutData.items['canvas-root'].childrenIds) {
      layoutData.items['canvas-root'].childrenIds = [];
    }
    layoutData.items['canvas-root'].childrenIds.push(cardId);
  }
  
  if (layout) {
    await prisma.workspaceLayout.update({
      where: { userId: user.id },
      data: { layout: JSON.stringify(layoutData) }
    });
  } else {
    await prisma.workspaceLayout.create({
      data: {
        userId: user.id,
        layout: JSON.stringify(layoutData)
      }
    });
  }
  
  console.log('Done - "小红书爆款笔记创作全流程" workflow added to canvas');
}

main().catch(console.error).finally(() => prisma.$disconnect());
