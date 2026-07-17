import { connectDB, getDB } from './src/config/db.js';
import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';

async function seed() {
  console.log('Iniciando povoamento do banco de dados...');
  try {
    const db = await connectDB();
    
    // 1. Garantir ou obter um usuário para ser autor/criador
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

    // 2. Peixes para adicionar
    const fishesToSeed = [
      {
        commonName: 'Neon Cardinal',
        scientificName: 'Paracheirodon axelrodi',
        category: 'Água Doce',
        description: 'Um dos peixes mais populares do aquarismo mundial. Destaca-se por suas listras brilhantes azul-neon e vermelho-vivo. Vive em cardumes e prefere águas ácidas e moles com bastante vegetação.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 3.5,
        lifespan: 5,
        phMin: 5.5,
        phMax: 6.5,
        tempMin: 24,
        tempMax: 28,
        compatibility: ['Neon Negro', 'Rodóstomo', 'Coridora', 'Limpa Vidro', 'Guppy'],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Peixe Palhaço Ocellaris',
        scientificName: 'Amphiprion ocellaris',
        category: 'Água Salgada',
        description: 'Imortalizado no cinema, é um peixe marinho resistente e de comportamento fascinante. Desenvolve uma relação simbiótica icônica com anêmonas-do-mar e é excelente para iniciantes no aquarismo marinho.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 8,
        lifespan: 8,
        phMin: 8.1,
        phMax: 8.4,
        tempMin: 24,
        tempMax: 26,
        compatibility: ['Blue Tang', 'Firefish', 'Blenio', 'Góbio'],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-779883309562?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Molly Negra',
        scientificName: 'Poecilia sphenops',
        category: 'Água Salobra',
        description: 'Totalmente negra, a Molly é um peixe extremamente ativo e ótimo comedor de algas. Adapta-se muito bem a aquários de água doce dura ou água salobra, sendo de reprodução extremamente fácil.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 6,
        lifespan: 3,
        phMin: 7.5,
        phMax: 8.2,
        tempMin: 22,
        tempMax: 28,
        compatibility: ['Plati', 'Espada', 'Guppy', 'Coridora'],
        imageUrl: 'https://images.unsplash.com/photo-1508817628294-5a453fa0b8fb?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Betta Splendens',
        scientificName: 'Betta splendens',
        category: 'Água Doce',
        description: 'Famoso por suas cores vibrantes e longas nadadeiras, o Betta é um peixe de labirinto que respira ar atmosférico. Devido à sua forte agressividade intra-específica, machos devem ser mantidos sozinhos.',
        temperament: 'Agressivo',
        diet: 'Carnívoro',
        averageSize: 6,
        lifespan: 3,
        phMin: 6.8,
        phMax: 7.2,
        tempMin: 24,
        tempMax: 30,
        compatibility: ['Neon', 'Coridora', 'Ampulária'],
        imageUrl: 'https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Cirurgião-Patela / Blue Tang',
        scientificName: 'Paracanthurus hepatus',
        category: 'Água Salgada',
        description: 'Um peixe marinho de cores intensas com corpo azul-brilhante e cauda amarela. Requer aquários grandes e compridos, pois é um nadador muito ativo e necessita de dieta rica em algas marinhas.',
        temperament: 'Semi-agressivo',
        diet: 'Herbívoro',
        averageSize: 20,
        lifespan: 12,
        phMin: 8.1,
        phMax: 8.4,
        tempMin: 24,
        tempMax: 28,
        compatibility: ['Peixe Palhaço', 'Firefish', 'Anthias'],
        imageUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Acará-Disco',
        scientificName: 'Symphysodon aequifasciatus',
        category: 'Água Doce',
        description: 'Considerado o rei do aquário de água doce por sua beleza majestosa e formato circular único. É um peixe exigente com a qualidade da água, necessitando de temperaturas elevadas e filtragem eficiente.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 15,
        lifespan: 10,
        phMin: 5.0,
        phMax: 6.5,
        tempMin: 26,
        tempMax: 30,
        compatibility: ['Neon Cardinal', 'Rodóstomo', 'Ramirezi', 'Coridora'],
        imageUrl: 'https://images.unsplash.com/photo-1572883637172-132d73347572?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Kinguio Dourado',
        scientificName: 'Carassius auratus',
        category: 'Água Doce',
        description: 'Um dos peixes mais antigos criados pelo homem. Prefere águas mais frias e necessita de muito espaço físico e excelente filtragem biológica devido à alta produção de detritos orgânicos.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 15,
        lifespan: 15,
        phMin: 7.0,
        phMax: 7.8,
        tempMin: 16,
        tempMax: 22,
        compatibility: ['Outros Kinguios', 'Dois-Pontos'],
        imageUrl: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Baiacu Verde',
        scientificName: 'Dichotomyctere nigroviridis',
        category: 'Água Salobra',
        description: 'Peixe inteligente e interativo com estampa verde salpicada. É famoso por sua capacidade de se inflar quando ameaçado e requer alimentos duros (como caramujos) para desgastar seus dentes em constante crescimento.',
        temperament: 'Agressivo',
        diet: 'Carnívoro',
        averageSize: 12,
        lifespan: 10,
        phMin: 7.8,
        phMax: 8.4,
        tempMin: 24,
        tempMax: 28,
        compatibility: ['Geralmente mantido em aquário mono-espécie devido à agressividade'],
        imageUrl: 'https://images.unsplash.com/photo-1524704654690-b56c05c78a02?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Guppy / Lebiste',
        scientificName: 'Poecilia reticulata',
        category: 'Água Doce',
        description: 'Peixe pequeno, extremamente colorido e muito prolífico. Ideal para aquaristas de todos os níveis de experiência devido à sua adaptabilidade e natureza pacífica clássica de aquário comunitário.',
        temperament: 'Pacífico',
        diet: 'Onívoro',
        averageSize: 4,
        lifespan: 2,
        phMin: 7.0,
        phMax: 8.0,
        tempMin: 22,
        tempMax: 28,
        compatibility: ['Plati', 'Neon', 'Molly', 'Coridora', 'Limpa Vidro'],
        imageUrl: 'https://images.unsplash.com/photo-1615966650071-855b15f29ad1?w=600&auto=format&fit=crop&q=60'
      },
      {
        commonName: 'Acará-Bandeira',
        scientificName: 'Pterophyllum scalare',
        category: 'Água Doce',
        description: 'Originário da Bacia Amazônica, destaca-se por seu formato de disco vertical e nadadeiras filamentosas majestosas. Peixe elegante e de cardume que atinge porte médio.',
        temperament: 'Semi-agressivo',
        diet: 'Onívoro',
        averageSize: 15,
        lifespan: 8,
        phMin: 6.0,
        phMax: 7.0,
        tempMin: 24,
        tempMax: 28,
        compatibility: ['Rodóstomo', 'Coridora', 'Mato Grosso', 'Cascudo'],
        imageUrl: 'https://images.unsplash.com/photo-1544551763-22cf96739ea0?w=600&auto=format&fit=crop&q=60'
      }
    ];

    let fishAddedCount = 0;
    for (const fish of fishesToSeed) {
      const exists = await db.collection('fishes').findOne({ commonName: fish.commonName });
      if (!exists) {
        await db.collection('fishes').insertOne({
          ...fish,
          createdBy: new ObjectId(userId),
          views: Math.floor(Math.random() * 50),
          createdAt: new Date()
        });
        fishAddedCount++;
      }
    }
    console.log(`Povoamento de peixes completo. ${fishAddedCount} novos peixes adicionados.`);

    // 3. Tópicos do fórum para adicionar
    const postsToSeed = [
      {
        title: 'Como fazer a ciclagem correta de um aquário?',
        content: 'Estou montando meu primeiro aquário de água doce (60 litros) e li sobre a importância da ciclagem. Quanto tempo devo realmente esperar antes de colocar os primeiros peixes? Posso usar aceleradores biológicos de qualidade para encurtar esse período com segurança?',
        category: 'Iniciantes'
      },
      {
        title: 'Quais plantas de baixa manutenção (low tech) vocês recomendam?',
        content: 'Não tenho sistema de injeção de CO2 nem substrato fértil complexo, apenas cascalho simples de rio e iluminação LED padrão. Quais plantas resistem bem nessas condições além de Anubias e Samambaias de Java? Quero dar mais vida ao aquário.',
        category: 'Plantados'
      },
      {
        title: 'Peixe com pequenos pontos brancos pelo corpo. É Íctio?',
        content: 'Reparei hoje de manhã que meu Kinguio está cheio de pequenos pontos brancos parecendo sal salpicado nas nadadeiras e no dorso. Ele também está se coçando constantemente no cascalho e nas pedras. Isso é ictio? Devo subir gradualmente a temperatura do aquário?',
        category: 'Doenças'
      },
      {
        title: 'Dúvida cruel: Filtro Canister vs. Filtro Hang-On para 100 Litros',
        content: 'Estou na dúvida entre comprar um canister compacto ou um hang-on robusto para o meu aquário de 100 litros. Qual oferece a melhor relação de filtragem biológica e facilidade de manutenção no longo prazo?',
        category: 'Equipamentos'
      },
      {
        title: 'Compartilhando: Fotos do meu aquário marinho após 6 meses de montagem',
        content: 'Fala pessoal! Queria compartilhar a evolução do meu reef de 150L. Os corais moles estão se desenvolvendo super bem e o casal de peixes palhaço finalmente fez simbiose com a anêmona BBT. Deixem suas opiniões e dicas!',
        category: 'Geral'
      },
      {
        title: 'Como combater a infestação de algas filamentosas verdes?',
        content: 'Tenho sofrido muito com algas filamentosas verdes cobrindo meu carpete de Eleocharis. Já reduzi o fotoperíodo para 6 horas diárias e diminui a alimentação, mas elas continuam crescendo. Alguma fauna limpadora eficiente ou produto seguro ajuda nesse caso?',
        category: 'Plantados'
      },
      {
        title: 'Termostato confiável: qual marca vocês recomendam hoje?',
        content: 'Moro em uma região bem fria e o inverno está chegando. Preciso comprar um termostato muito confiável para proteger meu aquário. Quais marcas vocês confiam mais hoje em dia? Hopar, Atman, Roxin ou Eheim?',
        category: 'Equipamentos'
      },
      {
        title: 'pH oscilando bastante entre o dia e a noite: como estabilizar?',
        content: 'O pH do meu aquário pela manhã mede 6.8, mas no final da tarde chega perto de 7.4. Essa variação diária de pH é prejudicial para os neons? Tenho algumas rochas no aquário e uso tamponador neutro, mas não segura estável de jeito nenhum.',
        category: 'Iniciantes'
      },
      {
        title: 'Tratamento eficaz para nadadeiras roídas / podridão bacteriana',
        content: 'Um dos meus Guppies apareceu hoje com as nadadeiras traseiras desfiadas e com as bordas avermelhadas. Suspeito fortemente de podridão bacteriana. Qual medicamento seguro para o aquário comunitário e plantas vocês recomendam para o tratamento?',
        category: 'Doenças'
      },
      {
        title: 'Qual seria a fauna perfeita para um nano aquário de 30 litros?',
        content: 'Estou planejando um nano aquário plantado de 30 litros. Pensei em colocar um Betta macho e alguns camarões Red Cherry. Será que a convivência dá certo ou o Betta vai acabar caçando e comendo os camarões? Aceito outras sugestões de micro-fauna!',
        category: 'Geral'
      }
    ];

    let postsAddedCount = 0;
    for (const post of postsToSeed) {
      const exists = await db.collection('posts').findOne({ title: post.title });
      if (!exists) {
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
              content: 'Boa pergunta! Também tenho interesse nesse assunto. Acompanhando o tópico.',
              createdAt: new Date()
            }
          ],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        postsAddedCount++;
      }
    }
    console.log(`Povoamento de discussões completo. ${postsAddedCount} novos tópicos adicionados.`);

    console.log('Banco de dados povoado com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('Erro ao povoar banco de dados:', error);
    process.exit(1);
  }
}

seed();
