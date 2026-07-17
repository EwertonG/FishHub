import { connectDB, getDB } from './src/config/db.js';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

async function seed() {
  console.log('Iniciando povoamento do banco de dados...');
  try {
    const db = await connectDB();

    await db.collection('fishes').deleteMany({});
    await db.collection('posts').deleteMany({});
    console.log('Coleções de peixes e posts limpas com sucesso.');

    let user = await db.collection('users').findOne({});

    if (!user) {
      console.log('Nenhum usuário encontrado. Criando usuário administrador padrão (admin@fishhub.com)...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const insertUserResult = await db.collection('users').insertOne({
        name: 'Aquarista Admin',
        email: 'admin@fishhub.com',
        password: hashedPassword,
        favorites: [],
        createdAt: new Date()
      });
      user = {
        _id: insertUserResult.insertedId,
        name: 'Aquarista Admin'
      };
    } else {
      console.log(`Usando usuário existente: ${user.name} (${user.email}) como criador/autor.`);
    }

    const userId = user._id;
    const userName = user.name;

    const fishesToSeed = [
      {
        commonName: 'Tilápia',
        scientificName: 'Oreochromis niloticus',
        category: 'Água Doce',
        description: 'Peixe muito resistente de origem africana, amplamente cultivado em todo o Brasil. Possui carne saborosa e grande adaptabilidade a diferentes tipos de criação.',
        temperament: 'Territorial',
        diet: 'Onívoro',
        averageSize: 45.0,
        lifespan: 10,
        phMin: 6.0,
        phMax: 8.5,
        tempMin: 20,
        tempMax: 30,
        compatibility: ['Pacu', 'Tambaqui', 'Cascudo'],
        imageUrl: '/api/uploads/tilapia.jpg'
      },
      {
        commonName: 'Tambaqui',
        scientificName: 'Colossoma macropomum',
        category: 'Água Doce',
        description: 'Peixe nativo da bacia amazônica, de grande porte, conhecido por se alimentar de frutos e sementes caídos na água. É muito apreciado na culinária nortista.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 90.0,
        lifespan: 15,
        phMin: 5.0,
        phMax: 7.5,
        tempMin: 22,
        tempMax: 29,
        compatibility: ['Pacu', 'Piraputanga', 'Cascudo'],
        imageUrl: '/api/uploads/tambaqui.jpg'
      },
      {
        commonName: 'Pirarucu',
        scientificName: 'Arapaima gigas',
        category: 'Água Doce',
        description: 'Conhecido como o gigante da Amazônia, é um dos maiores peixes de água doce do mundo. Possui respiração aérea obrigatória e escamas avermelhadas na cauda.',
        temperament: 'Agressivo',
        diet: 'Carnívoro',
        averageSize: 250.0,
        lifespan: 20,
        phMin: 6.0,
        phMax: 7.5,
        tempMin: 24,
        tempMax: 31,
        compatibility: ['Arrau', 'Tracajá', 'Peixes de grande porte'],
        imageUrl: '/api/uploads/pirarucu.jpg'
      },
      {
        commonName: 'Tucunaré',
        scientificName: 'Cichla ocellaris',
        category: 'Água Doce',
        description: 'Peixe predador voraz, muito cobiçado na pesca esportiva brasileira. Caracteriza-se pelo ocelo na nadadeira caudal, que imita um olho para enganar predadores.',
        temperament: 'Agressivo',
        diet: 'Carnívoro',
        averageSize: 60.0,
        lifespan: 12,
        phMin: 5.5,
        phMax: 6.5,
        tempMin: 24,
        tempMax: 30,
        compatibility: ['Aruanã', 'Piranha', 'Cascudo'],
        imageUrl: '/api/uploads/tucunare.jpg'
      },
      {
        commonName: 'Dourado',
        scientificName: 'Salminus brasiliensis',
        category: 'Água Doce',
        description: 'Chamado de "Rei do Rio", possui coloração dourada brilhante com listras pretas horizontais. É um predador veloz que habita rios de correnteza forte nas bacias da Prata e do São Francisco.',
        temperament: 'Agressivo',
        diet: 'Carnívoro',
        averageSize: 100.0,
        lifespan: 15,
        phMin: 6.5,
        phMax: 7.5,
        tempMin: 22,
        tempMax: 28,
        compatibility: ['Pacu', 'Pintado', 'Cascudo'],
        imageUrl: '/api/uploads/dourado.jpg'
      },
      {
        commonName: 'Sardinha',
        scientificName: 'Sardinella brasiliensis',
        category: 'Água Salgada',
        description: 'Pequeno peixe pelágico que vive em grandes cardumes na costa brasileira. É de extrema importância na cadeia alimentar marinha e na indústria pesqueira.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 20.0,
        lifespan: 5,
        phMin: 8.0,
        phMax: 8.4,
        tempMin: 18,
        tempMax: 24,
        compatibility: ['Outras sardinhas', 'Cavala', 'Tainha'],
        imageUrl: '/api/uploads/sardinha.jpg'
      },
      {
        commonName: 'Corvina',
        scientificName: 'Micropogonias furnieri',
        category: 'Água Salgada',
        description: 'Peixe demersal comum no fundo arenoso da costa brasileira. Alimenta-se de crustáceos, moluscos e pequenos peixes, sendo alvo frequente da pesca costeira.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 50.0,
        lifespan: 12,
        phMin: 8.0,
        phMax: 8.4,
        tempMin: 15,
        tempMax: 23,
        compatibility: ['Pescada', 'Tainha', 'Parati'],
        imageUrl: '/api/uploads/corvina.jpg'
      },
      {
        commonName: 'Pescada',
        scientificName: 'Cynoscion leiarchus',
        category: 'Água Salgada',
        description: 'Encontrada em todo o litoral do Brasil, tem hábitos carnívoros e carne branca muito macia e saborosa, sendo um dos peixes marinhos mais consumidos no país.',
        temperament: 'Pacífico',
        diet: 'Carnívoro',
        averageSize: 45.0,
        lifespan: 8,
        phMin: 8.0,
        phMax: 8.4,
        tempMin: 18,
        tempMax: 25,
        compatibility: ['Corvina', 'Robalo', 'Tainha'],
        imageUrl: '/api/uploads/pescada.jpg'
      },
      {
        commonName: 'Robalo',
        scientificName: 'Centropomus undecimalis',
        category: 'Água Salobra',
        description: 'Peixe eurialino muito valorizado, habita estuários, manguezais e águas costeiras. Possui uma linha lateral preta marcante e comportamento de caça muito estratégico.',
        temperament: 'Pacífico',
        diet: 'Carnívoro',
        averageSize: 80.0,
        lifespan: 15,
        phMin: 7.2,
        phMax: 8.2,
        tempMin: 22,
        tempMax: 28,
        compatibility: ['Tainha', 'Carapicu', 'Pescada'],
        imageUrl: '/api/uploads/robalo.jpg'
      },
      {
        commonName: 'Garoupa',
        scientificName: 'Epinephelus marginatus',
        category: 'Água Salgada',
        description: 'Famosa por estampar a cédula de 100 reais, habita recifes e costões rochosos do Brasil. Tem comportamento territorialista e pode viver por várias décadas.',
        temperament: 'Territorial',
        diet: 'Carnívoro',
        averageSize: 120.0,
        lifespan: 30,
        phMin: 8.1,
        phMax: 8.4,
        tempMin: 18,
        tempMax: 24,
        compatibility: ['Moreia', 'Sargo', 'Peixes de grande porte'],
        imageUrl: '/api/uploads/garoupa.jpg'
      }
    ];

    let fishAddedCount = 0;
    for (const fish of fishesToSeed) {
      await db.collection('fishes').insertOne({
        ...fish,
        createdBy: new ObjectId(userId),
        views: Math.floor(Math.random() * 50),
        createdAt: new Date()
      });
      fishAddedCount++;
    }
    console.log(`Povoamento de peixes completo. ${fishAddedCount} peixes brasileiros adicionados com caminhos de imagem locais .jpg.`);

    const postsToSeed = [
      {
        title: 'Dicas para criar Tilápias em caixas d\'água',
        content: 'Estou planejando iniciar um sistema de piscicultura doméstica usando duas caixas d\'água de 1000 litros. Quantos alevinos de Tilápia do Nilo posso colocar em cada caixa mantendo uma boa taxa de crescimento? Que tipo de filtragem biológica vocês consideram indispensável para esse setup?',
        category: 'Iniciantes'
      },
      {
        title: 'Qual o melhor setup para criar Tucunarés em aquário gigante?',
        content: 'Sei que Tucunarés crescem muito e exigem aquários gigantescos (pelo menos 800 a 1000 litros para o longo prazo). Alguém que tenha experiência na manutenção de Cichlas pode dar dicas sobre o fluxo de água ideal, filtragem mecânica reforçada e se eles aceitam bem rações extrusadas desde filhotes?',
        category: 'Equipamentos'
      },
      {
        title: 'Identificação de parasitas em Pirarucu juvenil',
        content: 'Comprei um Pirarucu juvenil para meu lago artificial de 5000 litros, mas notei que ele está nadando de lado e esfregando o corpo nos troncos. Há algumas marcas vermelhas perto da nadadeira dorsal. Pode ser Argulus (piolho de peixe)? Qual o tratamento seguro para aplicar em lagos dessa proporção?',
        category: 'Doenças'
      },
      {
        title: 'Como recriar um biótopo de manguezal para Robalos',
        content: 'Quero montar um aquário temático de água salobra simulando as raízes de mangue e a vegetação costeira para abrigar um casal de Robalos jovens. Qual a salinidade ideal a manter e quais plantas toleram essa variação de sal? Pensei em usar troncos tratados de aroeira para simular as raízes.',
        category: 'Geral'
      }
    ];

    let postsAddedCount = 0;
    for (const post of postsToSeed) {
      await db.collection('posts').insertOne({
        title: post.title,
        content: post.content,
        category: post.category,
        authorId: new ObjectId(userId),
        authorName: userName,
        likes: [],
        likesCount: 0,
        comments: [
          {
            _id: new ObjectId(),
            authorId: new ObjectId(userId),
            authorName: userName,
            content: 'Excelente tópico! Acompanhando para ver as sugestões dos demais membros.',
            createdAt: new Date()
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      postsAddedCount++;
    }
    console.log(`Povoamento de discussões completo. ${postsAddedCount} tópicos brasileiros adicionados.`);

    console.log('Banco de dados povoado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao povoar banco de dados:', error);
    process.exit(1);
  }
}

seed();
