import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnimeController } from './anime.controller';
import { AnimeService } from './anime.service';
import { Series, SeriesSchema } from './schemas/series.schema';
import { Episode, EpisodeSchema } from './schemas/episode.schema';
import { WatchHistory, WatchHistorySchema } from './schemas/watch-history.schema';
import { Favorite, FavoriteSchema } from './schemas/favorite.schema';
import { Playlist, PlaylistSchema } from './schemas/playlist.schema';
import { PlaylistItem, PlaylistItemSchema } from './schemas/playlist-item.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Series.name, schema: SeriesSchema },
      { name: Episode.name, schema: EpisodeSchema },
      { name: WatchHistory.name, schema: WatchHistorySchema },
      { name: Favorite.name, schema: FavoriteSchema },
      { name: Playlist.name, schema: PlaylistSchema },
      { name: PlaylistItem.name, schema: PlaylistItemSchema },
    ]),
  ],
  controllers: [AnimeController],
  providers: [AnimeService],
  exports: [AnimeService],
})
export class AnimeModule {}
