import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const params = await prisma.parameter.findMany()
    const map = {}
    for (const p of params) map[p.parameter] = p.value

    const old = map['Old Rate']
    const neu = map['New Rate']
    console.log('Found parameters:', { old, neu })

    if (old !== undefined) {
      await prisma.rate.updateMany({ where: { rateName: 'Old Rate' }, data: { value: parseFloat(old) } })
      console.log('Updated Old Rate value to', old)
    }
    if (neu !== undefined) {
      await prisma.rate.updateMany({ where: { rateName: 'New Rate' }, data: { value: parseFloat(neu) } })
      console.log('Updated New Rate value to', neu)
    }

    console.log('Done')
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
